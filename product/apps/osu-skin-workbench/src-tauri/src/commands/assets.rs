use osu_skin_workbench_core::{
    ApplyAssetGroupInput,
    AssetMutationResult,
    DeleteAssetGroupInput,
};
use tauri::AppHandle;

use crate::app_data_root;

#[tauri::command]
pub(crate) fn apply_asset_group(
    app: AppHandle,
    input: ApplyAssetGroupInput,
) -> Result<AssetMutationResult, String> {
    osu_skin_workbench_core::apply_asset_group(&app_data_root(&app)?, input)
}

#[tauri::command]
pub(crate) fn delete_asset_group(
    app: AppHandle,
    input: DeleteAssetGroupInput,
) -> Result<AssetMutationResult, String> {
    osu_skin_workbench_core::delete_asset_group(&app_data_root(&app)?, input)
}
