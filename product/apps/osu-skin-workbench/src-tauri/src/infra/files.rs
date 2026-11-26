use std::fs;
use std::path::Path;
use walkdir::WalkDir;

use crate::domain::project::RawFileEntry;
use crate::infra::paths::{managed_dir, normalize_relative_path, safe_join};

// Callers hold the workbench mutation lock. Populate a private sibling
// directory before moving the existing target. A failed promotion restores it.
pub(crate) fn with_staged_directory<T>(
    target: &Path,
    populate: impl FnOnce(&Path) -> Result<T, String>,
) -> Result<T, String> {
    let parent = target
        .parent()
        .ok_or_else(|| format!("target has no parent: {}", target.display()))?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("failed to create target parent: {error}"))?;
    let stage = tempfile::Builder::new()
        .prefix(".workbench-stage-")
        .tempdir_in(parent)
        .map_err(|error| format!("failed to create staging directory: {error}"))?;
    let candidate = stage.path().join("candidate");
    fs::create_dir(&candidate)
        .map_err(|error| format!("failed to create staged candidate: {error}"))?;
    let value = populate(&candidate)?;

    managed_dir(target.to_path_buf())?;
    let previous = stage.path().join("previous");
    let had_target = target
        .try_exists()
        .map_err(|error| format!("failed to inspect target: {error}"))?;
    if had_target {
        fs::rename(target, &previous)
            .map_err(|error| format!("failed to stage previous directory: {error}"))?;
    }
    if let Err(error) = fs::rename(&candidate, target) {
        if had_target {
            if let Err(restore_error) = fs::rename(&previous, target) {
                let recovery = stage.keep();
                return Err(format!(
                    "failed to replace target dir: {error}; failed to restore previous directory: {restore_error}; recovery: {}",
                    recovery.join("previous").display()
                ));
            }
        }
        return Err(format!("failed to replace target dir: {error}"));
    }
    // Replacement has already committed. Cleanup failure must not report
    // that the mutation did not occur.
    if let Err(error) = stage.close() {
        eprintln!("directory replaced at {}, but staging cleanup failed: {error}", target.display());
    }
    Ok(value)
}

pub(crate) fn read_skin_ini(root: &Path) -> Option<String> {
    fs::read_to_string(root.join("skin.ini")).ok()
}

pub(crate) fn walk_relative_files(root: &Path) -> Result<Vec<RawFileEntry>, String> {
    if !root
        .try_exists()
        .map_err(|error| format!("failed to inspect source directory: {error}"))?
    {
        return Ok(vec![]);
    }
    let mut files = Vec::new();
    for entry in WalkDir::new(root) {
        let entry = entry.map_err(|error| format!("failed to walk source directory: {error}"))?;
        if !entry.file_type().is_file() {
            continue;
        }
        let relative = entry
            .path()
            .strip_prefix(root)
            .map_err(|error| format!("failed to strip prefix: {error}"))?;
        files.push(RawFileEntry {
            relative_path: normalize_relative_path(relative),
            full_path: entry.path().to_string_lossy().to_string(),
        });
    }
    files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(files)
}

pub(crate) fn copy_dir_all(source: &Path, target: &Path) -> Result<usize, String> {
    with_staged_directory(target, |temp_target| {
        let mut count = 0;
        for entry in WalkDir::new(source) {
            let entry = entry.map_err(|error| format!("failed to walk source directory: {error}"))?;
            let relative = entry
                .path()
                .strip_prefix(source)
                .map_err(|error| format!("failed to strip prefix: {error}"))?;
            let out = temp_target.join(relative);
            if entry.file_type().is_dir() {
                fs::create_dir_all(&out)
                    .map_err(|error| format!("failed to create dir: {error}"))?;
            } else if entry.file_type().is_file() {
                if let Some(parent) = out.parent() {
                    fs::create_dir_all(parent)
                        .map_err(|error| format!("failed to create parent: {error}"))?;
                }
                fs::copy(entry.path(), &out)
                    .map_err(|error| format!("failed to copy file: {error}"))?;
                count += 1;
            }
        }
        Ok(count)
    })
}

pub(crate) fn rebuild_structured(raw_root: &Path, structured_root: &Path) -> Result<usize, String> {
    // Native migration keeps the original flat files and creates a conservative structured mirror.
    // Fine-grained semantic classification remains in TypeScript via @tenzyu/osu-skin-core.
    copy_dir_all(raw_root, structured_root)
}

pub(crate) fn remove_project_files(
    root: &Path,
    relative_paths: &[String],
) -> Result<usize, String> {
    let mut deleted = 0;
    for relative in relative_paths {
        let target = safe_join(root, relative)?;
        if target.exists() {
            fs::remove_file(target).map_err(|error| format!("failed to delete file: {error}"))?;
            deleted += 1;
        }
    }
    Ok(deleted)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_copy_source_does_not_replace_existing_target() {
        let fixture = tempfile::tempdir().unwrap();
        let source = fixture.path().join("missing");
        let target = fixture.path().join("target");
        fs::create_dir(&target).unwrap();
        fs::write(target.join("keep.png"), b"original").unwrap();

        let error = copy_dir_all(&source, &target).unwrap_err();
        assert!(error.contains("failed to walk source directory"), "{error}");
        assert_eq!(fs::read(target.join("keep.png")).unwrap(), b"original");
        assert_eq!(fs::read_dir(fixture.path()).unwrap().count(), 1);
    }

    #[test]
    fn directory_copy_preserves_files_and_empty_directories() {
        let fixture = tempfile::tempdir().unwrap();
        let source = fixture.path().join("source");
        let target = fixture.path().join("target");
        fs::create_dir_all(source.join("empty")).unwrap();
        fs::write(source.join("cursor.png"), b"asset").unwrap();
        assert_eq!(copy_dir_all(&source, &target).unwrap(), 1);
        assert_eq!(fs::read(target.join("cursor.png")).unwrap(), b"asset");
        assert!(target.join("empty").is_dir());
        let listed = walk_relative_files(&target).unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].relative_path, "cursor.png");
        assert!(walk_relative_files(&fixture.path().join("missing")).unwrap().is_empty());
    }

    #[test]
    fn failed_promotion_restores_existing_directory() {
        let fixture = tempfile::tempdir().unwrap();
        let target = fixture.path().join("target");
        fs::create_dir(&target).unwrap();
        fs::write(target.join("keep.png"), b"original").unwrap();
        let error = with_staged_directory(&target, |candidate| {
            // Force the final rename to fail after the old directory is staged.
            fs::remove_dir(candidate).unwrap();
            Ok(())
        }).unwrap_err();
        assert!(error.contains("failed to replace target dir"), "{error}");
        assert_eq!(fs::read(target.join("keep.png")).unwrap(), b"original");
        assert_eq!(fs::read_dir(fixture.path()).unwrap().count(), 1);
    }

    #[test]
    fn successful_promotion_replaces_existing_directory_and_cleans_stage() {
        let fixture = tempfile::tempdir().unwrap();
        let source = fixture.path().join("source");
        let target = fixture.path().join("target");
        fs::create_dir(&source).unwrap();
        fs::create_dir(&target).unwrap();
        fs::write(source.join("new.png"), b"new").unwrap();
        fs::write(target.join("old.png"), b"old").unwrap();
        assert_eq!(copy_dir_all(&source, &target).unwrap(), 1);
        assert_eq!(fs::read(target.join("new.png")).unwrap(), b"new");
        assert!(!target.join("old.png").exists());
        assert_eq!(fs::read_dir(fixture.path()).unwrap().count(), 2);
    }

    #[test]
    fn invalid_archive_preserves_existing_target_without_leaking_staging_directory() {
        let fixture = tempfile::tempdir().unwrap();
        let source = fixture.path().join("invalid.osk");
        let target = fixture.path().join("target");
        fs::write(&source, b"not a zip archive").unwrap();
        fs::create_dir(&target).unwrap();
        fs::write(target.join("keep.png"), b"original").unwrap();
        assert!(crate::infra::archive::extract_osk(&source, &target).is_err());
        assert_eq!(fs::read(target.join("keep.png")).unwrap(), b"original");
        assert_eq!(fs::read_dir(fixture.path()).unwrap().count(), 2);
    }
}
