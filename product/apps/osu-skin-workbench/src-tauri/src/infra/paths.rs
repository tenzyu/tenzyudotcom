use std::fs;
use std::path::{Component, Path, PathBuf};
use tauri::{AppHandle, Manager};

pub(crate) fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub(crate) fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;
    fs::create_dir_all(&root).map_err(|error| format!("failed to create app data dir: {error}"))?;
    Ok(root)
}

pub(crate) fn projects_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_data_root(app)?.join("skin-editor-projects");
    fs::create_dir_all(&root)
        .map_err(|error| format!("failed to create projects root: {error}"))?;
    Ok(root)
}

pub(crate) fn exports_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_data_root(app)?.join("exports");
    fs::create_dir_all(&root).map_err(|error| format!("failed to create exports root: {error}"))?;
    Ok(root)
}

pub(crate) fn project_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    safe_join(&projects_root(app)?, project_id)
}

pub(crate) fn project_raw_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?.join("project").join("raw"))
}

pub(crate) fn project_structured_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?
        .join("project")
        .join("structured"))
}

pub(crate) fn source_dir(
    app: &AppHandle,
    project_id: &str,
    source_id: &str,
) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?
        .join("sources")
        .join(source_id))
}

pub(crate) fn source_raw_dir(
    app: &AppHandle,
    project_id: &str,
    source_id: &str,
) -> Result<PathBuf, String> {
    Ok(source_dir(app, project_id, source_id)?.join("raw"))
}

pub(crate) fn source_structured_dir(
    app: &AppHandle,
    project_id: &str,
    source_id: &str,
) -> Result<PathBuf, String> {
    Ok(source_dir(app, project_id, source_id)?.join("structured"))
}

pub(crate) fn manifest_path(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?.join("manifest.json"))
}

pub(crate) fn normalize_relative_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn ensure_safe_relative(value: &str) -> Result<(), String> {
    let path = Path::new(value);
    if path.is_absolute() {
        return Err(format!("absolute path is not allowed: {value}"));
    }
    for component in path.components() {
        if matches!(component, Component::ParentDir) {
            return Err(format!("path traversal is not allowed: {value}"));
        }
    }
    Ok(())
}

pub(crate) fn safe_join(root: &Path, relative: &str) -> Result<PathBuf, String> {
    ensure_safe_relative(relative)?;
    Ok(root.join(relative))
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
    format!(
        "{}-{}-{}",
        slugify(prefix),
        chrono::Utc::now().format("%Y%m%d%H%M%S"),
        uuid::Uuid::new_v4().simple()
    )
}

#[cfg(test)]
mod tests {
    use super::{ensure_safe_relative, normalize_relative_path, slugify};
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
    }
}
