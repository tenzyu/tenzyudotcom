use icu_normalizer::ComposingNormalizer;
use std::collections::HashSet;
use std::fs::{self, File, Metadata, OpenOptions};
use std::io::{self, Read, Seek, Write};
use std::path::{Component, Path, PathBuf};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;

use crate::domain::project::ExportPreset;
use crate::infra::files::{copy_dir_all, require_disjoint_source, walk_relative_files, with_staged_directory};
use crate::infra::paths::{
    asset_file, is_link, managed_metadata, open_managed_file, validate_component,
};

const MAX_OSK_FILES: usize = 20_000;
const MAX_OSK_UNCOMPRESSED_BYTES: u64 = 2 * 1024 * 1024 * 1024;

pub(crate) fn extract_osk(source: &Path, target: &Path) -> Result<(), String> {
    require_disjoint_source(source, target)?;
    with_staged_directory(target, |temp_target| {
        let file = File::open(source).map_err(|error| format!("failed to open osk: {error}"))?;
        let mut archive = zip::ZipArchive::new(file)
            .map_err(|error| format!("failed to read osk archive: {error}"))?;
        if archive.len() > MAX_OSK_FILES {
            return Err(format!("osk archive has too many files: {}", archive.len()));
        }
        let mut total_uncompressed_bytes = 0_u64;
        let mut names = HashSet::new();
        let normalizer = ComposingNormalizer::new_nfc();
        for index in 0..archive.len() {
            let mut member = archive
                .by_index(index)
                .map_err(|error| format!("failed to read archive member: {error}"))?;
            total_uncompressed_bytes = total_uncompressed_bytes.saturating_add(member.size());
            if total_uncompressed_bytes > MAX_OSK_UNCOMPRESSED_BYTES {
                return Err("osk archive exceeds maximum uncompressed size".into());
            }
            let enclosed = member
                .enclosed_name()
                .ok_or_else(|| format!("unsafe archive member at index {index}: {:?}", member.name()))?
                .to_owned();
            let name = archive_name(&enclosed)?;
            if name.is_empty() || !names.insert(normalizer.normalize(&name.to_uppercase()).into_owned()) {
                return Err(format!("empty or colliding archive path: {name}"));
            }
            let out_path = temp_target.join(enclosed);
            if member.is_dir() {
                fs::create_dir_all(&out_path)
                    .map_err(|error| format!("failed to create archive dir: {error}"))?;
                continue;
            }
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|error| format!("failed to create archive parent: {error}"))?;
            }
            let mut out = OpenOptions::new().write(true).create_new(true).open(&out_path)
                .map_err(|error| format!("failed to create archive output: {error}"))?;
            let expected = member.size();
            let copied = io::copy(&mut Read::by_ref(&mut member).take(expected + 1), &mut out)
                .map_err(|error| format!("failed to extract archive member: {error}"))?;
            if copied != expected {
                return Err(format!("archive member size mismatch: {name}"));
            }
        }
        Ok(())
    })
}

pub(crate) fn copy_source_to_raw(source_path: &str, target_raw: &Path) -> Result<usize, String> {
    let source = PathBuf::from(source_path);
    if source.is_dir() {
        return copy_dir_all(&source, target_raw);
    }
    if source.is_file()
        && source
            .extension()
            .and_then(|value| value.to_str())
            .map(|value| value.eq_ignore_ascii_case("osk"))
            .unwrap_or(false)
    {
        extract_osk(&source, target_raw)?;
        return Ok(walk_relative_files(target_raw)?.len());
    }
    Err(format!(
        "source must be an .osk file or extracted skin folder: {source_path}"
    ))
}

fn is_hd_path(relative: &str) -> bool {
    let lower = relative.to_ascii_lowercase();
    lower.contains("@2x.")
}

fn source_changed(path: &Path) -> String {
    format!("export source changed while reading: {}", path.display())
}

fn check_snapshot(path: &Path, expected: &Metadata, current: &Metadata) -> Result<(), String> {
    let modified = |metadata: &Metadata| {
        metadata.modified().map_err(|error| {
            format!(
                "failed to inspect modification time of {}: {error}",
                path.display()
            )
        })
    };
    let changed = expected.file_type() != current.file_type()
        || expected.len() != current.len()
        || modified(expected)? != modified(current)?;
    #[cfg(unix)]
    let changed = {
        use std::os::unix::fs::MetadataExt;
        changed
            || expected.dev() != current.dev()
            || expected.ino() != current.ino()
            || expected.ctime() != current.ctime()
            || expected.ctime_nsec() != current.ctime_nsec()
    };
    #[cfg(windows)]
    let changed = {
        use std::os::windows::fs::MetadataExt;
        changed || expected.creation_time() != current.creation_time()
    };
    if changed {
        return Err(source_changed(path));
    }
    Ok(())
}

fn check_path_snapshot(path: &Path, expected: &Metadata) -> Result<(), String> {
    let current = managed_metadata(path)
        .map_err(|error| {
            format!(
                "failed to inspect export source {}: {error}",
                path.display()
            )
        })?
        .ok_or_else(|| source_changed(path))?;
    check_snapshot(path, expected, &current)
}

fn open_snapshot(path: &Path, expected: &Metadata) -> Result<File, String> {
    let (file, current) = open_managed_file(path, OpenOptions::new().read(true))
        .map_err(|error| format!("failed to open export source {}: {error}", path.display()))?;
    check_snapshot(path, expected, &current)?;
    Ok(file)
}

fn check_open_snapshot(file: &File, path: &Path, expected: &Metadata) -> Result<(), String> {
    let current = file.metadata().map_err(|error| {
        format!(
            "failed to inspect open export source {}: {error}",
            path.display()
        )
    })?;
    check_snapshot(path, expected, &current)?;
    check_path_snapshot(path, expected)
}

fn matches_main_file(
    path: &Path,
    metadata: &Metadata,
    main: &Path,
    name: &str,
) -> Result<bool, String> {
    let (main_file, main_metadata) = asset_file(main, name)?;
    let Some(main_metadata) = main_metadata else {
        return Ok(false);
    };
    if metadata.len() != main_metadata.len() {
        return Ok(false);
    }

    let mut left = open_snapshot(path, metadata)?;
    let mut right = open_snapshot(&main_file, &main_metadata)?;
    let mut left_bytes = [0; 16 * 1024];
    let mut right_bytes = [0; 16 * 1024];
    let mut remaining = metadata.len();
    let mut equal = true;
    while remaining != 0 {
        let size = remaining.min(left_bytes.len() as u64) as usize;
        left.read_exact(&mut left_bytes[..size])
            .map_err(|error| format!("failed to compare {}: {error}", path.display()))?;
        right
            .read_exact(&mut right_bytes[..size])
            .map_err(|error| format!("failed to compare {}: {error}", main_file.display()))?;
        if left_bytes[..size] != right_bytes[..size] {
            equal = false;
            break;
        }
        remaining -= size as u64;
    }
    check_open_snapshot(&left, path, metadata)?;
    check_open_snapshot(&right, &main_file, &main_metadata)?;
    Ok(equal)
}

fn archive_name(relative: &Path) -> Result<String, String> {
    let mut name = String::new();
    for component in relative.components() {
        let Component::Normal(component) = component else {
            return Err(format!("unsafe archive path: {}", relative.display()));
        };
        let component = component
            .to_str()
            .ok_or_else(|| format!("non-UTF-8 archive path: {}", relative.display()))?;
        validate_component(component)?;
        if !name.is_empty() {
            name.push('/');
        }
        name.push_str(component);
    }
    Ok(name)
}

pub(crate) fn add_project_to_zip<T: Write + Seek>(
    writer: &mut zip::ZipWriter<T>,
    root: &Path,
    root_metadata: &Metadata,
    preset: ExportPreset,
    main: Option<(&Path, &Metadata)>,
) -> Result<(usize, usize), String> {
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let mut included = 0;
    let mut excluded = 0;
    let mut names = HashSet::new();
    let normalizer = ComposingNormalizer::new_nfc();
    let mut directories = Vec::new();
    let mut walk = WalkDir::new(root)
        .follow_root_links(false)
        .sort_by_file_name()
        .into_iter();
    while let Some(entry) = walk.next() {
        let entry = entry.map_err(|error| format!("failed to walk export source: {error}"))?;
        let path = entry.path();
        let metadata = entry
            .metadata()
            .map_err(|error| format!("failed to inspect export entry: {error}"))?;
        if entry.depth() == 0 {
            check_snapshot(path, root_metadata, &metadata)?;
            continue;
        }
        if entry.file_type() != metadata.file_type() {
            return Err(source_changed(path));
        }
        if is_link(&metadata) || !(metadata.is_file() || metadata.is_dir()) {
            if matches!(preset, ExportPreset::Backup) {
                return Err(format!("unsupported entry in backup: {}", path.display()));
            }
            if entry.file_type().is_dir() {
                walk.skip_current_dir();
            }
            continue;
        }
        let relative = path
            .strip_prefix(root)
            .map_err(|error| format!("failed to strip zip prefix: {error}"))?;
        let name = archive_name(relative)?;
        if metadata.is_file() {
            let include = match preset {
                ExportPreset::SdOnly => !is_hd_path(&name),
                ExportPreset::HdOnly => is_hd_path(&name),
                ExportPreset::Diff => {
                    let (main, _) = main.ok_or("diff export requires a main source")?;
                    !matches_main_file(path, &metadata, main, &name)?
                }
                ExportPreset::Full | ExportPreset::Backup => true,
            };
            if !include {
                excluded += 1;
                continue;
            }
        }
        if !names.insert(normalizer.normalize(&name.to_uppercase()).into_owned()) {
            return Err(format!("colliding archive path: {name}"));
        }
        if metadata.is_dir() {
            directories.push((entry.into_path(), metadata));
            continue;
        }

        let mut file = open_snapshot(path, &metadata)?;
        writer
            .start_file(
                &name,
                options.large_file(metadata.len() >= u64::from(u32::MAX)),
            )
            .map_err(|error| format!("failed to start ZIP entry {name}: {error}"))?;
        let copied = io::copy(&mut Read::by_ref(&mut file).take(metadata.len()), writer)
            .map_err(|error| format!("failed to stream ZIP entry {name}: {error}"))?;
        if copied != metadata.len() {
            return Err(source_changed(path));
        }
        check_open_snapshot(&file, path, &metadata)?;
        included += 1;
    }

    for (path, metadata) in directories {
        check_path_snapshot(&path, &metadata)?;
    }
    check_path_snapshot(root, root_metadata)?;
    if let Some((path, metadata)) = main {
        check_path_snapshot(path, metadata)?;
    }
    Ok((included, excluded))
}

#[cfg(test)]
mod import_tests {
    use super::*;

    #[test]
    fn colliding_members_do_not_replace_existing_target() {
        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("test.osk");
        let target = temp.path().join("target");
        fs::create_dir(&target).unwrap();
        fs::write(target.join("keep.png"), b"original").unwrap();
        let mut writer = zip::ZipWriter::new(File::create(&source).unwrap());
        for name in ["A.png", "a.png"] {
            writer.start_file(name, SimpleFileOptions::default()).unwrap();
            writer.write_all(b"asset").unwrap();
        }
        writer.finish().unwrap();
        assert!(extract_osk(&source, &target).is_err());
        assert_eq!(fs::read(target.join("keep.png")).unwrap(), b"original");
        assert_eq!(fs::read_dir(&target).unwrap().count(), 1);
    }
}

// Diagnostic CI workload replay of PR #151; no behavior change.
