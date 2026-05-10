use std::fs::{self, File};
use std::io::{Read, Seek, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;

use crate::infra::files::{copy_dir_all, walk_relative_files};
use crate::infra::paths::normalize_relative_path;

pub(crate) fn extract_osk(source: &Path, target: &Path) -> Result<(), String> {
    if target.exists() {
        fs::remove_dir_all(target).map_err(|error| format!("failed to clean extraction target: {error}"))?;
    }
    fs::create_dir_all(target).map_err(|error| format!("failed to create extraction target: {error}"))?;
    let file = File::open(source).map_err(|error| format!("failed to open osk: {error}"))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|error| format!("failed to read osk archive: {error}"))?;
    for index in 0..archive.len() {
        let mut member = archive.by_index(index).map_err(|error| format!("failed to read archive member: {error}"))?;
        let enclosed = member.enclosed_name().ok_or_else(|| format!("unsafe archive member: {}", member.name()))?.to_owned();
        let out_path = target.join(enclosed);
        if member.is_dir() {
            fs::create_dir_all(&out_path).map_err(|error| format!("failed to create archive dir: {error}"))?;
            continue;
        }
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|error| format!("failed to create archive parent: {error}"))?;
        }
        let mut out = File::create(&out_path).map_err(|error| format!("failed to create archive output: {error}"))?;
        std::io::copy(&mut member, &mut out).map_err(|error| format!("failed to extract archive member: {error}"))?;
    }
    Ok(())
}

pub(crate) fn copy_source_to_raw(source_path: &str, target_raw: &Path) -> Result<usize, String> {
    let source = PathBuf::from(source_path);
    if source.is_dir() {
        return copy_dir_all(&source, target_raw);
    }
    if source.is_file() && source.extension().and_then(|value| value.to_str()).map(|value| value.eq_ignore_ascii_case("osk")).unwrap_or(false) {
        extract_osk(&source, target_raw)?;
        return Ok(walk_relative_files(target_raw)?.len());
    }
    Err(format!("source must be an .osk file or extracted skin folder: {source_path}"))
}

pub(crate) fn is_hd_path(relative: &str) -> bool {
    let lower = relative.to_ascii_lowercase();
    lower.contains("@2x.")
}

pub(crate) fn files_equal(left: &Path, right: &Path) -> bool {
    if !right.exists() {
        return false;
    }
    let left = fs::read(left).unwrap_or_default();
    let right = fs::read(right).unwrap_or_default();
    left == right
}

pub(crate) fn add_dir_to_zip<T: Write + Seek>(writer: &mut zip::ZipWriter<T>, root: &Path) -> Result<usize, String> {
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let mut count = 0;
    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let relative = entry.path().strip_prefix(root).map_err(|error| format!("failed to strip zip prefix: {error}"))?;
        let name = normalize_relative_path(relative);
        writer.start_file(name, options).map_err(|error| format!("failed to start zip file: {error}"))?;
        let mut file = File::open(entry.path()).map_err(|error| format!("failed to open file for zip: {error}"))?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|error| format!("failed to read file for zip: {error}"))?;
        writer.write_all(&buffer).map_err(|error| format!("failed to write zip entry: {error}"))?;
        count += 1;
    }
    Ok(count)
}
