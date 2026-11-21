use std::fs::{self, File, Metadata, OpenOptions};
use std::io;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use crate::domain::project::ExportPreset;

pub(crate) fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub(crate) fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;
    managed_dir(root)
}

pub(crate) fn projects_root(app_data: &Path) -> Result<PathBuf, String> {
    managed_dir(app_data.join("skin-editor-projects"))
}

pub(crate) fn export_dir(app_data: &Path, project_id: &str) -> Result<PathBuf, String> {
    validate_component(project_id)?;
    let root = managed_dir(app_data.join("exports"))?;
    managed_dir(root.join(project_id))
}

pub(crate) fn export_file(
    dir: &Path,
    project_id: &str,
    file_name: &str,
) -> Result<PathBuf, String> {
    if !ExportPreset::ALL
        .iter()
        .any(|preset| preset.file_name(project_id) == file_name)
    {
        return Err(format!(
            "unknown export filename for project {project_id}: {file_name}"
        ));
    }
    managed_file(dir.join(file_name))
}

pub(crate) fn project_dir(app_data: &Path, project_id: &str) -> Result<PathBuf, String> {
    validate_component(project_id)?;
    managed_dir(projects_root(app_data)?.join(project_id))
}

pub(crate) fn project_raw_dir(app_data: &Path, project_id: &str) -> Result<PathBuf, String> {
    working_tree(project_dir(app_data, project_id)?, "raw")
}

pub(crate) fn project_structured_dir(app_data: &Path, project_id: &str) -> Result<PathBuf, String> {
    working_tree(project_dir(app_data, project_id)?, "structured")
}

fn working_tree(project: PathBuf, name: &str) -> Result<PathBuf, String> {
    let parent = managed_dir(project.join("project"))?;
    managed_dir(parent.join(name))
}

pub(crate) fn source_dir(
    app_data: &Path,
    project_id: &str,
    source_id: &str,
) -> Result<PathBuf, String> {
    validate_component(source_id)?;
    let sources = managed_dir(project_dir(app_data, project_id)?.join("sources"))?;
    managed_dir(sources.join(source_id))
}

pub(crate) fn source_raw_dir(
    app_data: &Path,
    project_id: &str,
    source_id: &str,
) -> Result<PathBuf, String> {
    managed_dir(source_dir(app_data, project_id, source_id)?.join("raw"))
}

pub(crate) fn source_structured_dir(
    app_data: &Path,
    project_id: &str,
    source_id: &str,
) -> Result<PathBuf, String> {
    managed_dir(source_dir(app_data, project_id, source_id)?.join("structured"))
}

pub(crate) fn manifest_path(project: &Path) -> Result<PathBuf, String> {
    managed_file(project.join("manifest.json"))
}

pub(crate) fn is_link(metadata: &Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;
        if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
            return true;
        }
    }
    metadata.is_symlink()
}

pub(crate) fn managed_metadata(path: &Path) -> io::Result<Option<Metadata>> {
    match fs::symlink_metadata(path) {
        Ok(metadata) if is_link(&metadata) => Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "symlinks and reparse points are unsupported",
        )),
        Ok(metadata) => Ok(Some(metadata)),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

pub(crate) fn managed_dir(path: PathBuf) -> Result<PathBuf, String> {
    let metadata = managed_metadata(&path)
        .map_err(|error| format!("failed to inspect directory {}: {error}", path.display()))?;
    if metadata.is_some_and(|metadata| !metadata.is_dir()) {
        return Err(format!("expected a directory: {}", path.display()));
    }
    Ok(path)
}

pub(crate) fn require_directory(path: &Path) -> Result<Metadata, String> {
    managed_metadata(path)
        .map_err(|error| format!("failed to inspect directory {}: {error}", path.display()))?
        .filter(Metadata::is_dir)
        .ok_or_else(|| {
            format!(
                "required directory is missing or not a directory: {}",
                path.display()
            )
        })
}

fn managed_file_metadata(path: &Path) -> Result<Option<Metadata>, String> {
    let metadata = managed_metadata(path)
        .map_err(|error| format!("failed to inspect file {}: {error}", path.display()))?;
    if metadata
        .as_ref()
        .is_some_and(|metadata| !metadata.is_file())
    {
        return Err(format!("expected a regular file: {}", path.display()));
    }
    Ok(metadata)
}

pub(crate) fn managed_file(path: PathBuf) -> Result<PathBuf, String> {
    managed_file_metadata(&path)?;
    Ok(path)
}

pub(crate) fn open_managed_file(
    path: &Path,
    options: &mut OpenOptions,
) -> io::Result<(File, Metadata)> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        const FILE_FLAG_OPEN_REPARSE_POINT: u32 = 0x0020_0000;
        options.custom_flags(FILE_FLAG_OPEN_REPARSE_POINT);
    }
    let file = options.open(path)?;
    let metadata = file.metadata()?;
    if is_link(&metadata) || !metadata.is_file() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "expected a regular file",
        ));
    }
    Ok((file, metadata))
}

pub(crate) fn normalize_relative_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn validate_component(value: &str) -> Result<(), String> {
    if value.is_empty()
        || value.ends_with(['.', ' '])
        || value
            .chars()
            .any(|ch| ch.is_control() || "<>:\"/\\|?*".contains(ch))
    {
        return Err(format!("invalid path component: {value:?}"));
    }
    let stem = value
        .split('.')
        .next()
        .unwrap_or_default()
        .trim_end_matches(' ');
    let device = stem.to_ascii_uppercase();
    if matches!(
        device.as_str(),
        "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$"
    ) || device
        .strip_prefix("COM")
        .or_else(|| device.strip_prefix("LPT"))
        .is_some_and(|suffix| {
            matches!(
                suffix,
                "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
            )
        })
    {
        return Err(format!("reserved path component: {value:?}"));
    }
    Ok(())
}

fn ensure_safe_relative(value: &str) -> Result<(), String> {
    value.split('/').try_for_each(validate_component)
}

pub(crate) fn asset_file(
    root: &Path,
    relative: &str,
) -> Result<(PathBuf, Option<Metadata>), String> {
    ensure_safe_relative(relative)?;
    let mut components = relative.split('/');
    let name = components
        .next_back()
        .expect("validated asset path has a name");
    let mut parent = root.to_path_buf();
    for component in components {
        parent = managed_dir(parent.join(component))?;
    }
    let path = parent.join(name);
    let metadata = managed_file_metadata(&path)?;
    Ok((path, metadata))
}

pub(crate) fn safe_join(root: &Path, relative: &str) -> Result<PathBuf, String> {
    asset_file(root, relative).map(|(path, _)| path)
}

pub(crate) fn slugify(value: &str) -> String {
    let mut slug = String::new();
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.' {
            slug.push(ch.to_ascii_lowercase());
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    let trimmed = slug.trim_matches('-').to_string();
    if trimmed.is_empty() {
        "skin-project".into()
    } else {
        trimmed
    }
}

pub(crate) fn entity_id(prefix: &str) -> String {
    let id = format!(
        "{}-{}-{}",
        slugify(prefix),
        chrono::Utc::now().format("%Y%m%d%H%M%S"),
        uuid::Uuid::new_v4().simple()
    );
    if validate_component(&id).is_err() {
        return format!("skin-{id}");
    }
    id
}

#[cfg(test)]
mod tests {
    use super::{
        ensure_safe_relative, entity_id, normalize_relative_path, slugify, validate_component,
    };
    use std::path::Path;

    #[test]
    fn rejects_absolute_and_parent_relative_paths() {
        assert!(ensure_safe_relative("/tmp/skin.png").is_err());
        assert!(ensure_safe_relative("../skin.png").is_err());
        assert!(ensure_safe_relative("nested/../../skin.png").is_err());
    }

    #[test]
    fn accepts_nested_relative_paths() {
        assert!(ensure_safe_relative("hitcircles/default-0.png").is_ok());
    }

    #[test]
    fn normalizes_and_slugifies_project_paths() {
        assert_eq!(normalize_relative_path(Path::new("a/b/c.png")), "a/b/c.png");
        assert_eq!(slugify("My Skin! 2026"), "my-skin-2026");
        assert!(validate_component(&entity_id("Con.skin")).is_ok());
    }
}
