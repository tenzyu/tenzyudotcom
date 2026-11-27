use osu_skin_workbench_core::{
    AddProjectSourceInput,
    CreateProjectInput,
    DeleteProjectSourceInput,
    ProjectManifest,
    RawProjectFilesResponse,
    RebuildStructuredResult,
    RenameProjectSourceInput,
};
use tauri::AppHandle;

use crate::app_data_root;

#[tauri::command]
pub(crate) fn health_check() -> &'static str {
    "ok"
}

#[tauri::command]
pub(crate) fn list_projects(app: AppHandle) -> Result<Vec<ProjectManifest>, String> {
    osu_skin_workbench_core::list_projects(&app_data_root(&app)?)
}

#[tauri::command]
pub(crate) fn create_project(
    app: AppHandle,
    input: CreateProjectInput,
) -> Result<ProjectManifest, String> {
    osu_skin_workbench_core::create_project(&app_data_root(&app)?, input)
}

#[tauri::command]
pub(crate) fn rename_project(
    app: AppHandle,
    project_id: String,
    name: String,
) -> Result<ProjectManifest, String> {
    osu_skin_workbench_core::rename_project_at(&app_data_root(&app)?, &project_id, &name)
}

#[tauri::command]
pub(crate) fn delete_project(app: AppHandle, project_id: String) -> Result<(), String> {
    osu_skin_workbench_core::delete_project(&app_data_root(&app)?, project_id)
}

#[tauri::command]
pub(crate) fn add_project_source(
    app: AppHandle,
    input: AddProjectSourceInput,
) -> Result<ProjectManifest, String> {
    osu_skin_workbench_core::add_project_source(&app_data_root(&app)?, input)
}

#[tauri::command]
pub(crate) fn rename_project_source(
    app: AppHandle,
    input: RenameProjectSourceInput,
) -> Result<ProjectManifest, String> {
    osu_skin_workbench_core::rename_project_source(&app_data_root(&app)?, input)
}

#[tauri::command]
pub(crate) fn delete_project_source(
    app: AppHandle,
    input: DeleteProjectSourceInput,
) -> Result<ProjectManifest, String> {
    osu_skin_workbench_core::delete_project_source(&app_data_root(&app)?, input)
}

#[tauri::command]
pub(crate) fn get_project_files(
    app: AppHandle,
    project_id: String,
) -> Result<RawProjectFilesResponse, String> {
    osu_skin_workbench_core::get_project_files(&app_data_root(&app)?, project_id)
}

#[tauri::command]
pub(crate) fn rebuild_structured_mirrors(
    app: AppHandle,
    project_id: String,
) -> Result<RebuildStructuredResult, String> {
    osu_skin_workbench_core::rebuild_structured_mirrors(&app_data_root(&app)?, project_id)
}
