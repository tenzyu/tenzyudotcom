use tauri::AppHandle;

use osu_skin_workbench_core::{export_dir, export_file, project_dir};

use crate::app_data_root;

fn open_system_path(path: std::path::PathBuf) -> Result<(), String> {
    tauri_plugin_opener::open_path(path, None::<&str>)
        .map_err(|error| format!("failed to open path: {error}"))
}

#[tauri::command]
pub(crate) fn open_project_dir(app: AppHandle, project_id: String) -> Result<(), String> {
    let dir = project_dir(&app_data_root(&app)?, &project_id)?;
    if !dir.exists() {
        return Err(format!("unknown project: {project_id}"));
    }
    open_system_path(dir)
}

#[tauri::command]
pub(crate) fn open_export_dir(app: AppHandle, project_id: String) -> Result<(), String> {
    let dir = export_dir(&app_data_root(&app)?, &project_id)?;
    if !dir.exists() {
        return Err(format!(
            "export directory does not exist for project: {project_id}"
        ));
    }
    open_system_path(dir)
}

#[tauri::command]
pub(crate) fn open_export_file(
    app: AppHandle,
    project_id: String,
    file_name: String,
) -> Result<(), String> {
    let dir = export_dir(&app_data_root(&app)?, &project_id)?;
    let file = export_file(&dir, &project_id, &file_name)?;
    if !file.is_file() {
        return Err(format!("export file does not exist: {file_name}"));
    }
    open_system_path(file)
}
