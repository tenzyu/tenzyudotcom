use std::fs;
use std::path::Path;

use crate::domain::project::{ExportPreset, ExportProjectInput, ExportResult, MAIN_SOURCE_ID};
use crate::infra::archive::add_project_to_zip;
use crate::infra::lock::lock_workbench;
use crate::infra::manifest::read_manifest;
use crate::infra::paths::{
    export_dir, export_file, project_dir, project_raw_dir, require_directory,
    source_raw_dir,
};

pub fn export_at(app_data: &Path, input: ExportProjectInput) -> Result<ExportResult, String> {
    let _lock = lock_workbench(app_data)?;
    let ExportProjectInput { project_id, preset } = input;
    read_manifest(app_data, &project_id)?;
    let root = match preset {
        ExportPreset::Backup => project_dir(app_data, &project_id)?,
        _ => project_raw_dir(app_data, &project_id)?,
    };
    let root_metadata = require_directory(&root)?;
    let main = if matches!(preset, ExportPreset::Diff) {
        let path = source_raw_dir(app_data, &project_id, MAIN_SOURCE_ID)?;
        let metadata = require_directory(&path)?;
        Some((path, metadata))
    } else {
        None
    };

    let output_dir = export_dir(app_data, &project_id)?;
    let file_name = preset.file_name(&project_id);
    let output_path = export_file(&output_dir, &project_id, &file_name)?;
    fs::create_dir_all(&output_dir)
        .map_err(|error| format!("failed to create export directory: {error}"))?;

    let mut temporary = tempfile::Builder::new()
        .prefix(".workbench-export-")
        .suffix(".tmp")
        .tempfile_in(&output_dir)
        .map_err(|error| format!("failed to create temporary export: {error}"))?;

    #[cfg(test)]
    let temporary_path = temporary.path().to_path_buf();
    #[cfg(test)]
    let output = tests::TestWriter(temporary.as_file_mut());
    #[cfg(not(test))]
    let output = temporary.as_file_mut();
    let mut writer = zip::ZipWriter::new(output);
    #[cfg(test)]
    tests::checkpoint(tests::Phase::Walk, &root)
        .map_err(|error| format!("failed to prepare export walk: {error}"))?;
    let (file_count, excluded_count) = add_project_to_zip(
        &mut writer,
        &root,
        &root_metadata,
        preset,
        main.as_ref()
            .map(|(path, metadata)| (path.as_path(), metadata)),
    )?;
    #[cfg(test)]
    tests::checkpoint(tests::Phase::Finish, &temporary_path)
        .map_err(|error| format!("failed to prepare ZIP finalization: {error}"))?;
    writer
        .finish()
        .map_err(|error| format!("failed to finish export ZIP: {error}"))?;
    #[cfg(test)]
    tests::checkpoint(tests::Phase::SyncTemp, &temporary_path)
        .map_err(|error| format!("failed to sync temporary export: {error}"))?;
    temporary
        .as_file()
        .sync_all()
        .map_err(|error| format!("failed to sync temporary export: {error}"))?;
    let temporary_path = temporary.into_temp_path();

    // Check the destination again after streaming, before handing it to the OS.
    let output_dir = export_dir(app_data, &project_id)?;
    export_file(&output_dir, &project_id, &file_name)?;
    #[cfg(unix)]
    let parent = fs::File::open(output_dir)
        .map_err(|error| format!("failed to open export directory for sync: {error}"))?;
    #[cfg(test)]
    tests::checkpoint(tests::Phase::Replace, &temporary_path)
        .map_err(|error| format!("failed to prepare export replacement: {error}"))?;
    temporary_path.persist(&output_path).map_err(|error| {
        format!(
            "failed to replace export {}: {error}",
            output_path.display()
        )
    })?;

    #[cfg(unix)]
    {
        #[cfg(test)]
        let sync = tests::checkpoint(tests::Phase::SyncParent, &output_path)
            .and_then(|()| parent.sync_all());
        #[cfg(not(test))]
        let sync = parent.sync_all();
        sync.map_err(|error| {
            format!(
                "export published at {}, but durability could not be confirmed: {error}",
                output_path.display()
            )
        })?;
    }

    let note = match preset {
        ExportPreset::SdOnly => "Excluded @2x HD assets.",
        ExportPreset::HdOnly => "Included only @2x HD assets.",
        ExportPreset::Diff => "Included only files that differ from the main source snapshot.",
        ExportPreset::Backup => "Included the whole editor project directory.",
        ExportPreset::Full => "Included all project raw files.",
    };
    Ok(ExportResult {
        preset,
        output_path: output_path.to_string_lossy().into_owned(),
        file_count,
        excluded_count,
        notes: vec![note.into()],
    })
}

#[cfg(test)]
mod tests;
