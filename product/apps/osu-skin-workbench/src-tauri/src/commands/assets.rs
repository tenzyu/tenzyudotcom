use std::fs;
use tauri::AppHandle;

use crate::domain::project::{ApplyAssetGroupInput, AssetMutationResult, DeleteAssetGroupInput};
use crate::infra::files::{rebuild_structured, remove_project_files};
use crate::infra::paths::{project_raw_dir, project_structured_dir, safe_join, source_raw_dir};

#[tauri::command]
pub(crate) fn apply_asset_group(app: AppHandle, input: ApplyAssetGroupInput) -> Result<AssetMutationResult, String> {
    let project_root = project_raw_dir(&app, &input.project_id)?;
    let source_root = source_raw_dir(&app, &input.project_id, &input.source_id)?;
    if !source_root.exists() {
        return Err(format!("unknown source: {}", input.source_id));
    }
    let replace = input.replace_project_paths.unwrap_or_default();
    let deleted_count = remove_project_files(&project_root, &replace)?;
    let mut copied_count = 0;
    for relative in input.source_paths {
        let source = safe_join(&source_root, &relative)?;
        let target = safe_join(&project_root, &relative)?;
        if !source.exists() {
            return Err(format!("source file is missing: {relative}"));
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|error| format!("failed to create target parent: {error}"))?;
        }
        fs::copy(source, target).map_err(|error| format!("failed to copy asset: {error}"))?;
        copied_count += 1;
    }
    let rebuilt_structured_count = rebuild_structured(&project_root, &project_structured_dir(&app, &input.project_id)?)?;
    Ok(AssetMutationResult { copied_count, deleted_count, rebuilt_structured_count })
}

#[tauri::command]
pub(crate) fn delete_asset_group(app: AppHandle, input: DeleteAssetGroupInput) -> Result<AssetMutationResult, String> {
    let project_root = project_raw_dir(&app, &input.project_id)?;
    let deleted_count = remove_project_files(&project_root, &input.project_paths)?;
    let rebuilt_structured_count = rebuild_structured(&project_root, &project_structured_dir(&app, &input.project_id)?)?;
    Ok(AssetMutationResult { copied_count: 0, deleted_count, rebuilt_structured_count })
}
