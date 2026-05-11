use tauri::AppHandle;

use crate::infra::paths::{exports_root, project_dir, safe_join};

fn open_system_path(path: std::path::PathBuf) -> Result<(), String> {
    let path = path.to_string_lossy().to_string();

    #[cfg(target_os = "linux")]
    let command = ("xdg-open", vec![path]);
    #[cfg(target_os = "macos")]
    let command = ("open", vec![path]);
    #[cfg(target_os = "windows")]
    let command = ("cmd", vec!["/C".into(), "start".into(), path]);

    std::process::Command::new(command.0)
        .args(command.1)
        .spawn()
        .map_err(|error| format!("failed to open path: {error}"))?;
    Ok(())
}

#[tauri::command]
pub(crate) fn open_project_dir(app: AppHandle, project_id: String) -> Result<(), String> {
    let dir = project_dir(&app, &project_id)?;
    if !dir.exists() {
        return Err(format!("unknown project: {project_id}"));
    }
    open_system_path(dir)
}

#[tauri::command]
pub(crate) fn open_export_dir(app: AppHandle, project_id: String) -> Result<(), String> {
    let dir = exports_root(&app)?.join(&project_id);
    if !dir.exists() {
        return Err(format!("export directory does not exist for project: {project_id}"));
    }
    open_system_path(dir)
}

#[tauri::command]
pub(crate) fn open_export_file(
    app: AppHandle,
    project_id: String,
    file_name: String,
) -> Result<(), String> {
    let file = safe_join(&exports_root(&app)?.join(&project_id), &file_name)?;
    if !file.is_file() {
        return Err(format!("export file does not exist: {file_name}"));
    }
    open_system_path(file)
}
