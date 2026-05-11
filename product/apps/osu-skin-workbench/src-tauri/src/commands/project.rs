use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

use crate::domain::project::{
    AddProjectSourceInput, CreateProjectInput, DeleteProjectSourceInput, ProjectManifest,
    RawProjectFilesResponse, RawSourceFiles, RebuildStructuredResult, RenameProjectSourceInput,
    SourceManifest, MAIN_SOURCE_ID,
};
use crate::infra::archive::copy_source_to_raw;
use crate::infra::files::{read_skin_ini, rebuild_structured, walk_relative_files};
use crate::infra::manifest::{
    ensure_main_source, main_source_manifest, read_manifest, write_manifest,
};
use crate::infra::paths::{
    entity_id, now, project_dir, project_raw_dir, project_structured_dir, projects_root,
    source_dir, source_raw_dir, source_structured_dir,
};

#[tauri::command]
pub(crate) fn health_check() -> &'static str {
    "ok"
}

#[tauri::command]
pub(crate) fn list_projects(app: AppHandle) -> Result<Vec<ProjectManifest>, String> {
    let root = projects_root(&app)?;
    let mut projects = Vec::new();
    for entry in fs::read_dir(root).map_err(|error| format!("failed to read projects: {error}"))? {
        let entry = entry.map_err(|error| format!("failed to read project entry: {error}"))?;
        if !entry
            .file_type()
            .map_err(|error| format!("failed to read project entry type: {error}"))?
            .is_dir()
        {
            continue;
        }
        let manifest_path = entry.path().join("manifest.json");
        if !manifest_path.exists() {
            continue;
        }
        let content = fs::read_to_string(manifest_path)
            .map_err(|error| format!("failed to read manifest: {error}"))?;
        let mut manifest: ProjectManifest = serde_json::from_str(&content)
            .map_err(|error| format!("failed to parse manifest: {error}"))?;
        ensure_main_source(&mut manifest);
        projects.push(manifest);
    }
    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(projects)
}

#[tauri::command]
pub(crate) fn create_project(
    app: AppHandle,
    input: CreateProjectInput,
) -> Result<ProjectManifest, String> {
    let source = PathBuf::from(&input.source_path);
    let name = input
        .name
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            source
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("Skin Project")
                .to_string()
        });
    let id = entity_id(&name);
    let created_at = now();
    let raw_dir = project_raw_dir(&app, &id)?;
    let structured_dir = project_structured_dir(&app, &id)?;
    let source_raw = source_raw_dir(&app, &id, MAIN_SOURCE_ID)?;
    let source_structured = source_structured_dir(&app, &id, MAIN_SOURCE_ID)?;

    copy_source_to_raw(&input.source_path, &raw_dir)?;
    rebuild_structured(&raw_dir, &structured_dir)?;
    copy_source_to_raw(&input.source_path, &source_raw)?;
    rebuild_structured(&source_raw, &source_structured)?;

    let mut manifest = ProjectManifest {
        id,
        name: name.clone(),
        main_source_path: input.source_path.clone(),
        created_at: created_at.clone(),
        updated_at: created_at.clone(),
        sources: vec![main_source_manifest(&name, &input.source_path, &created_at)],
    };
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
pub(crate) fn rename_project(
    app: AppHandle,
    project_id: String,
    name: String,
) -> Result<ProjectManifest, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("project name is required".into());
    }
    let mut manifest = read_manifest(&app, &project_id)?;
    ensure_main_source(&mut manifest);
    manifest.name = trimmed.into();
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
pub(crate) fn delete_project(app: AppHandle, project_id: String) -> Result<(), String> {
    let dir = project_dir(&app, &project_id)?;
    if dir.exists() {
        fs::remove_dir_all(dir).map_err(|error| format!("failed to delete project: {error}"))?;
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn add_project_source(
    app: AppHandle,
    input: AddProjectSourceInput,
) -> Result<ProjectManifest, String> {
    let mut manifest = read_manifest(&app, &input.project_id)?;
    ensure_main_source(&mut manifest);
    let source = PathBuf::from(&input.source_path);
    let name = input
        .name
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            source
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("Source Skin")
                .to_string()
        });
    let source_id = entity_id(&name);
    let raw = source_raw_dir(&app, &input.project_id, &source_id)?;
    let structured = source_structured_dir(&app, &input.project_id, &source_id)?;
    copy_source_to_raw(&input.source_path, &raw)?;
    rebuild_structured(&raw, &structured)?;
    manifest.sources.push(SourceManifest {
        id: source_id,
        name,
        source_path: input.source_path,
        created_at: now(),
        readonly: None,
    });
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
pub(crate) fn rename_project_source(
    app: AppHandle,
    input: RenameProjectSourceInput,
) -> Result<ProjectManifest, String> {
    let trimmed = input.name.trim();
    if trimmed.is_empty() {
        return Err("source name is required".into());
    }
    let mut manifest = read_manifest(&app, &input.project_id)?;
    ensure_main_source(&mut manifest);
    let source = manifest
        .sources
        .iter_mut()
        .find(|source| source.id == input.source_id)
        .ok_or_else(|| format!("unknown source: {}", input.source_id))?;
    source.name = trimmed.into();
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
pub(crate) fn delete_project_source(
    app: AppHandle,
    input: DeleteProjectSourceInput,
) -> Result<ProjectManifest, String> {
    let mut manifest = read_manifest(&app, &input.project_id)?;
    ensure_main_source(&mut manifest);
    let source = manifest
        .sources
        .iter()
        .find(|source| source.id == input.source_id)
        .ok_or_else(|| format!("unknown source: {}", input.source_id))?;
    if source.readonly.unwrap_or(false) {
        return Err("main source cannot be deleted".into());
    }
    manifest
        .sources
        .retain(|source| source.id != input.source_id);
    let dir = source_dir(&app, &input.project_id, &input.source_id)?;
    if dir.exists() {
        fs::remove_dir_all(dir).map_err(|error| format!("failed to delete source: {error}"))?;
    }
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
pub(crate) fn get_project_files(
    app: AppHandle,
    project_id: String,
) -> Result<RawProjectFilesResponse, String> {
    let mut manifest = read_manifest(&app, &project_id)?;
    ensure_main_source(&mut manifest);
    let project_root = project_raw_dir(&app, &project_id)?;
    let project = walk_relative_files(&project_root)?;
    let project_skin_ini = read_skin_ini(&project_root);
    let mut sources = Vec::new();
    for source in manifest.sources {
        let root = source_raw_dir(&app, &project_id, &source.id)?;
        sources.push(RawSourceFiles {
            id: source.id,
            name: source.name,
            source_path: source.source_path,
            created_at: source.created_at,
            readonly: source.readonly,
            files: walk_relative_files(&root)?,
            skin_ini: read_skin_ini(&root),
        });
    }
    Ok(RawProjectFilesResponse {
        project,
        project_skin_ini,
        sources,
    })
}

#[tauri::command]
pub(crate) fn rebuild_structured_mirrors(
    app: AppHandle,
    project_id: String,
) -> Result<RebuildStructuredResult, String> {
    let mut manifest = read_manifest(&app, &project_id)?;
    ensure_main_source(&mut manifest);
    let project_file_count = rebuild_structured(
        &project_raw_dir(&app, &project_id)?,
        &project_structured_dir(&app, &project_id)?,
    )?;
    let mut source_file_counts = HashMap::new();
    for source in manifest.sources {
        let raw = source_raw_dir(&app, &project_id, &source.id)?;
        let structured = source_structured_dir(&app, &project_id, &source.id)?;
        let count = if raw.exists() {
            rebuild_structured(&raw, &structured)?
        } else {
            0
        };
        source_file_counts.insert(source.id, count);
    }
    Ok(RebuildStructuredResult {
        project_file_count,
        source_file_counts,
    })
}
