use std::fs;
use std::path::Path;
use walkdir::WalkDir;

use crate::domain::project::RawFileEntry;
use crate::infra::paths::{normalize_relative_path, safe_join};

fn temp_sibling_for(target: &Path) -> Result<std::path::PathBuf, String> {
    let parent = target
        .parent()
        .ok_or_else(|| format!("target has no parent: {}", target.display()))?;
    let name = target
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("target has no file name: {}", target.display()))?;
    Ok(parent.join(format!("{name}.tmp-{}", uuid::Uuid::new_v4().simple())))
}

fn replace_dir_with_temp(temp: &Path, target: &Path) -> Result<(), String> {
    if target.exists() {
        fs::remove_dir_all(target).map_err(|error| format!("failed to clean target: {error}"))?;
    }
    fs::rename(temp, target).map_err(|error| format!("failed to replace target dir: {error}"))
}

pub(crate) fn read_skin_ini(root: &Path) -> Option<String> {
    fs::read_to_string(root.join("skin.ini")).ok()
}

pub(crate) fn walk_relative_files(root: &Path) -> Result<Vec<RawFileEntry>, String> {
    if !root.exists() {
        return Ok(vec![]);
    }
    let mut files = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok) {
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
    let temp_target = temp_sibling_for(target)?;
    if temp_target.exists() {
        fs::remove_dir_all(&temp_target)
            .map_err(|error| format!("failed to clean temp target: {error}"))?;
    }
    fs::create_dir_all(&temp_target)
        .map_err(|error| format!("failed to create temp target: {error}"))?;
    let mut count = 0;
    let result = (|| {
        for entry in WalkDir::new(source).into_iter().filter_map(Result::ok) {
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
        replace_dir_with_temp(&temp_target, target)?;
        Ok(count)
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&temp_target);
    }
    result
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
