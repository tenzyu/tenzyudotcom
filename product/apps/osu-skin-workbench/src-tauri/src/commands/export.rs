use std::fs::{self, File};
use std::path::PathBuf;
use tauri::AppHandle;

use crate::domain::project::{ExportPreset, ExportProjectInput, ExportResult, MAIN_SOURCE_ID};
use crate::infra::archive::{add_dir_to_zip, files_equal, is_hd_path};
use crate::infra::files::walk_relative_files;
use crate::infra::paths::{exports_root, project_dir, project_raw_dir, safe_join, source_raw_dir};

#[tauri::command]
pub(crate) fn export_project(
    app: AppHandle,
    input: ExportProjectInput,
) -> Result<ExportResult, String> {
    let output_root = exports_root(&app)?.join(&input.project_id);
    if output_root.exists() {
        fs::remove_dir_all(&output_root)
            .map_err(|error| format!("failed to clean export dir: {error}"))?;
    }
    fs::create_dir_all(&output_root)
        .map_err(|error| format!("failed to create export dir: {error}"))?;
    let stage_root = output_root.join("stage");
    fs::create_dir_all(&stage_root)
        .map_err(|error| format!("failed to create export stage: {error}"))?;
    let raw_root = match input.preset {
        ExportPreset::Backup => project_dir(&app, &input.project_id)?,
        _ => project_raw_dir(&app, &input.project_id)?,
    };
    let main_root = source_raw_dir(&app, &input.project_id, MAIN_SOURCE_ID)?;
    let mut copied = 0;
    let mut skipped = 0;

    for file in walk_relative_files(&raw_root)? {
        let include = match input.preset {
            ExportPreset::Backup | ExportPreset::Full => true,
            ExportPreset::SdOnly => !is_hd_path(&file.relative_path),
            ExportPreset::HdOnly => is_hd_path(&file.relative_path),
            ExportPreset::Diff => !files_equal(
                &PathBuf::from(&file.full_path),
                &safe_join(&main_root, &file.relative_path)?,
            ),
        };
        if !include {
            skipped += 1;
            continue;
        }
        let target = safe_join(&stage_root, &file.relative_path)?;
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("failed to create export parent: {error}"))?;
        }
        fs::copy(&file.full_path, target)
            .map_err(|error| format!("failed to stage export file: {error}"))?;
        copied += 1;
    }

    let file_name = match input.preset {
        ExportPreset::Backup => format!("{}.backup.zip", input.project_id),
        ExportPreset::Full => format!("{}.full.osk", input.project_id),
        ExportPreset::SdOnly => format!("{}.sd-only.osk", input.project_id),
        ExportPreset::HdOnly => format!("{}.hd-only.osk", input.project_id),
        ExportPreset::Diff => format!("{}.diff.osk", input.project_id),
    };
    let output_path = output_root.join(file_name);
    let output = File::create(&output_path)
        .map_err(|error| format!("failed to create export file: {error}"))?;
    let mut writer = zip::ZipWriter::new(output);
    let zip_count = add_dir_to_zip(&mut writer, &stage_root)?;
    writer
        .finish()
        .map_err(|error| format!("failed to finish export zip: {error}"))?;
    fs::remove_dir_all(stage_root).ok();

    let notes = match input.preset {
        ExportPreset::SdOnly => vec!["Excluded @2x HD assets.".into()],
        ExportPreset::HdOnly => vec!["Included only @2x HD assets.".into()],
        ExportPreset::Diff => {
            vec!["Included only files that differ from the main source snapshot.".into()]
        }
        ExportPreset::Backup => vec!["Included the whole editor project directory.".into()],
        ExportPreset::Full => vec!["Included all project raw files.".into()],
    };

    Ok(ExportResult {
        preset: input.preset,
        output_path: output_path.to_string_lossy().to_string(),
        file_count: zip_count.max(copied),
        excluded_count: skipped,
        notes,
    })
}
