use std::fs;
use std::io::Write;
use tauri::AppHandle;

use crate::domain::project::{ProjectManifest, SourceManifest, MAIN_SOURCE_ID};
use crate::infra::paths::{manifest_path, now, project_dir};

pub(crate) fn read_manifest(app: &AppHandle, project_id: &str) -> Result<ProjectManifest, String> {
    let content = fs::read_to_string(manifest_path(app, project_id)?)
        .map_err(|error| format!("failed to read manifest: {error}"))?;
    serde_json::from_str(&content).map_err(|error| format!("failed to parse manifest: {error}"))
}

pub(crate) fn write_manifest(
    app: &AppHandle,
    manifest: &mut ProjectManifest,
) -> Result<(), String> {
    manifest.updated_at = now();
    let dir = project_dir(app, &manifest.id)?;
    fs::create_dir_all(&dir).map_err(|error| format!("failed to create project dir: {error}"))?;
    let content = serde_json::to_string_pretty(manifest)
        .map_err(|error| format!("failed to encode manifest: {error}"))?;
    let target = manifest_path(app, &manifest.id)?;
    let temp = target.with_extension(format!("json.tmp-{}", uuid::Uuid::new_v4().simple()));
    let mut file = fs::File::create(&temp)
        .map_err(|error| format!("failed to create manifest temp file: {error}"))?;
    file.write_all(content.as_bytes())
        .map_err(|error| format!("failed to write manifest temp file: {error}"))?;
    file.write_all(b"\n")
        .map_err(|error| format!("failed to finalize manifest temp file: {error}"))?;
    file.sync_all()
        .map_err(|error| format!("failed to sync manifest temp file: {error}"))?;
    fs::rename(&temp, target).map_err(|error| {
        let _ = fs::remove_file(&temp);
        format!("failed to replace manifest atomically: {error}")
    })
}

pub(crate) fn main_source_manifest(
    name: &str,
    source_path: &str,
    created_at: &str,
) -> SourceManifest {
    SourceManifest {
        id: MAIN_SOURCE_ID.into(),
        name: format!("{name} (main)"),
        source_path: source_path.into(),
        created_at: created_at.into(),
        readonly: Some(true),
    }
}

pub(crate) fn ensure_main_source(manifest: &mut ProjectManifest) {
    if manifest
        .sources
        .iter()
        .any(|source| source.id == MAIN_SOURCE_ID)
    {
        return;
    }
    let source = main_source_manifest(
        &manifest.name,
        &manifest.main_source_path,
        &manifest.created_at,
    );
    manifest.sources.insert(0, source);
}
