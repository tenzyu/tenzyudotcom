use std::fs;
use tauri::AppHandle;

use crate::domain::project::{ApplyAssetGroupInput, AssetMutationResult, DeleteAssetGroupInput};
use crate::infra::files::{copy_dir_all, rebuild_structured, remove_project_files};
use crate::infra::paths::{project_raw_dir, project_structured_dir, safe_join, source_raw_dir};

fn rollback_dir_for(dir: &std::path::Path) -> Result<std::path::PathBuf, String> {
    let parent = dir
        .parent()
        .ok_or_else(|| format!("directory has no parent: {}", dir.display()))?;
    let name = dir
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| format!("directory has no file name: {}", dir.display()))?;
    Ok(parent.join(format!(
        "{name}.rollback-{}",
        uuid::Uuid::new_v4().simple()
    )))
}

fn with_project_raw_rollback<T>(
    project_root: &std::path::Path,
    structured_root: &std::path::Path,
    mutation: impl FnOnce() -> Result<T, String>,
) -> Result<T, String> {
    let rollback_root = rollback_dir_for(project_root)?;
    if project_root.exists() {
        copy_dir_all(project_root, &rollback_root)?;
    }

    let result = mutation();

    match result {
        Ok(value) => {
            let _ = fs::remove_dir_all(&rollback_root);
            Ok(value)
        }
        Err(error) => {
            if rollback_root.exists() {
                let _ = fs::remove_dir_all(project_root);
                fs::rename(&rollback_root, project_root)
                    .map_err(|rollback_error| {
                        format!(
                            "{error}; additionally failed to roll back project raw files: {rollback_error}"
                        )
                    })?;
                let _ = rebuild_structured(project_root, structured_root);
            }
            Err(error)
        }
    }
}

#[tauri::command]
pub(crate) fn apply_asset_group(
    app: AppHandle,
    input: ApplyAssetGroupInput,
) -> Result<AssetMutationResult, String> {
    let project_root = project_raw_dir(&app, &input.project_id)?;
    let structured_root = project_structured_dir(&app, &input.project_id)?;
    let source_root = source_raw_dir(&app, &input.project_id, &input.source_id)?;
    if !source_root.exists() {
        return Err(format!("unknown source: {}", input.source_id));
    }
    let replace = input.replace_project_paths.unwrap_or_default();
    let source_paths = input.source_paths;

    for relative in &source_paths {
        let source = safe_join(&source_root, relative)?;
        if !source.exists() {
            return Err(format!("source file is missing: {relative}"));
        }
    }

    with_project_raw_rollback(&project_root, &structured_root, || {
        let deleted_count = remove_project_files(&project_root, &replace)?;
        let mut copied_count = 0;
        for relative in source_paths {
            let source = safe_join(&source_root, &relative)?;
            let target = safe_join(&project_root, &relative)?;
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)
                    .map_err(|error| format!("failed to create target parent: {error}"))?;
            }
            fs::copy(source, target).map_err(|error| format!("failed to copy asset: {error}"))?;
            copied_count += 1;
        }
        let rebuilt_structured_count = rebuild_structured(&project_root, &structured_root)?;
        Ok(AssetMutationResult {
            copied_count,
            deleted_count,
            rebuilt_structured_count,
        })
    })
}

#[tauri::command]
pub(crate) fn delete_asset_group(
    app: AppHandle,
    input: DeleteAssetGroupInput,
) -> Result<AssetMutationResult, String> {
    let project_root = project_raw_dir(&app, &input.project_id)?;
    let structured_root = project_structured_dir(&app, &input.project_id)?;
    with_project_raw_rollback(&project_root, &structured_root, || {
        let deleted_count = remove_project_files(&project_root, &input.project_paths)?;
        let rebuilt_structured_count = rebuild_structured(&project_root, &structured_root)?;
        Ok(AssetMutationResult {
            copied_count: 0,
            deleted_count,
            rebuilt_structured_count,
        })
    })
}
