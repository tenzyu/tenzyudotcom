use osu_skin_workbench_core::{
    ExportProjectInput,
    ExportResult,
};
use tauri::AppHandle;

use crate::app_data_root;

#[tauri::command]
pub(crate) fn export_project(
    app: AppHandle,
    input: ExportProjectInput,
) -> Result<ExportResult, String> {
    osu_skin_workbench_core::export_at(&app_data_root(&app)?, input)
}
