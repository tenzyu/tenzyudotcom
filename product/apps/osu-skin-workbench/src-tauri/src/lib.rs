use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Seek, Write};
use std::path::{Component, Path, PathBuf};
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;

const MAIN_SOURCE_ID: &str = "main";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SourceManifest {
    id: String,
    name: String,
    source_path: String,
    created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    readonly: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProjectManifest {
    id: String,
    name: String,
    main_source_path: String,
    created_at: String,
    updated_at: String,
    sources: Vec<SourceManifest>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectInput {
    source_path: String,
    name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AddProjectSourceInput {
    project_id: String,
    source_path: String,
    name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RenameProjectSourceInput {
    project_id: String,
    source_id: String,
    name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeleteProjectSourceInput {
    project_id: String,
    source_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RawFileEntry {
    relative_path: String,
    full_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RawSourceFiles {
    id: String,
    name: String,
    source_path: String,
    created_at: String,
    readonly: Option<bool>,
    files: Vec<RawFileEntry>,
    skin_ini: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RawProjectFilesResponse {
    project: Vec<RawFileEntry>,
    project_skin_ini: Option<String>,
    sources: Vec<RawSourceFiles>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RebuildStructuredResult {
    project_file_count: usize,
    source_file_counts: HashMap<String, usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetMutationResult {
    copied_count: usize,
    deleted_count: usize,
    rebuilt_structured_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
enum ExportPreset {
    Full,
    SdOnly,
    HdOnly,
    Diff,
    Backup,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportProjectInput {
    project_id: String,
    preset: ExportPreset,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportResult {
    preset: ExportPreset,
    output_path: String,
    file_count: usize,
    excluded_count: usize,
    notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApplyAssetGroupInput {
    project_id: String,
    source_id: String,
    source_paths: Vec<String>,
    replace_project_paths: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeleteAssetGroupInput {
    project_id: String,
    project_paths: Vec<String>,
}

#[tauri::command]
fn health_check() -> &'static str {
    "ok"
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn app_data_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;
    fs::create_dir_all(&root).map_err(|error| format!("failed to create app data dir: {error}"))?;
    Ok(root)
}

fn projects_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_data_root(app)?.join("skin-editor-projects");
    fs::create_dir_all(&root).map_err(|error| format!("failed to create projects root: {error}"))?;
    Ok(root)
}

fn exports_root(app: &AppHandle) -> Result<PathBuf, String> {
    let root = app_data_root(app)?.join("exports");
    fs::create_dir_all(&root).map_err(|error| format!("failed to create exports root: {error}"))?;
    Ok(root)
}

fn project_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(safe_join(&projects_root(app)?, project_id)?)
}

fn project_raw_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?.join("project").join("raw"))
}

fn project_structured_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?.join("project").join("structured"))
}

fn source_dir(app: &AppHandle, project_id: &str, source_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?.join("sources").join(source_id))
}

fn source_raw_dir(app: &AppHandle, project_id: &str, source_id: &str) -> Result<PathBuf, String> {
    Ok(source_dir(app, project_id, source_id)?.join("raw"))
}

fn source_structured_dir(app: &AppHandle, project_id: &str, source_id: &str) -> Result<PathBuf, String> {
    Ok(source_dir(app, project_id, source_id)?.join("structured"))
}

fn manifest_path(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_dir(app, project_id)?.join("manifest.json"))
}

fn normalize_relative_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn ensure_safe_relative(value: &str) -> Result<(), String> {
    let path = Path::new(value);
    if path.is_absolute() {
        return Err(format!("absolute path is not allowed: {value}"));
    }
    for component in path.components() {
        if matches!(component, Component::ParentDir) {
            return Err(format!("path traversal is not allowed: {value}"));
        }
    }
    Ok(())
}

fn safe_join(root: &Path, relative: &str) -> Result<PathBuf, String> {
    ensure_safe_relative(relative)?;
    Ok(root.join(relative))
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.' {
            slug.push(ch.to_ascii_lowercase());
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    let trimmed = slug.trim_matches('-').to_string();
    if trimmed.is_empty() { "skin-project".into() } else { trimmed }
}

fn entity_id(prefix: &str) -> String {
    format!("{}-{}-{}", slugify(prefix), chrono::Utc::now().format("%Y%m%d%H%M%S"), uuid::Uuid::new_v4().simple())
}

fn read_manifest(app: &AppHandle, project_id: &str) -> Result<ProjectManifest, String> {
    let content = fs::read_to_string(manifest_path(app, project_id)?)
        .map_err(|error| format!("failed to read manifest: {error}"))?;
    serde_json::from_str(&content).map_err(|error| format!("failed to parse manifest: {error}"))
}

fn write_manifest(app: &AppHandle, manifest: &mut ProjectManifest) -> Result<(), String> {
    manifest.updated_at = now();
    let dir = project_dir(app, &manifest.id)?;
    fs::create_dir_all(&dir).map_err(|error| format!("failed to create project dir: {error}"))?;
    let content = serde_json::to_string_pretty(manifest)
        .map_err(|error| format!("failed to encode manifest: {error}"))?;
    fs::write(manifest_path(app, &manifest.id)?, content)
        .map_err(|error| format!("failed to write manifest: {error}"))
}

fn read_skin_ini(root: &Path) -> Option<String> {
    fs::read_to_string(root.join("skin.ini")).ok()
}

fn walk_relative_files(root: &Path) -> Result<Vec<RawFileEntry>, String> {
    if !root.exists() {
        return Ok(vec![]);
    }
    let mut files = Vec::new();
    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let relative = entry.path().strip_prefix(root)
            .map_err(|error| format!("failed to strip prefix: {error}"))?;
        files.push(RawFileEntry {
            relative_path: normalize_relative_path(relative),
            full_path: entry.path().to_string_lossy().to_string(),
        });
    }
    files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(files)
}

fn copy_dir_all(source: &Path, target: &Path) -> Result<usize, String> {
    if target.exists() {
        fs::remove_dir_all(target).map_err(|error| format!("failed to clean target: {error}"))?;
    }
    fs::create_dir_all(target).map_err(|error| format!("failed to create target: {error}"))?;
    let mut count = 0;
    for entry in WalkDir::new(source).into_iter().filter_map(Result::ok) {
        let relative = entry.path().strip_prefix(source)
            .map_err(|error| format!("failed to strip prefix: {error}"))?;
        let out = target.join(relative);
        if entry.file_type().is_dir() {
            fs::create_dir_all(&out).map_err(|error| format!("failed to create dir: {error}"))?;
        } else if entry.file_type().is_file() {
            if let Some(parent) = out.parent() {
                fs::create_dir_all(parent).map_err(|error| format!("failed to create parent: {error}"))?;
            }
            fs::copy(entry.path(), &out).map_err(|error| format!("failed to copy file: {error}"))?;
            count += 1;
        }
    }
    Ok(count)
}

fn extract_osk(source: &Path, target: &Path) -> Result<(), String> {
    if target.exists() {
        fs::remove_dir_all(target).map_err(|error| format!("failed to clean extraction target: {error}"))?;
    }
    fs::create_dir_all(target).map_err(|error| format!("failed to create extraction target: {error}"))?;
    let file = File::open(source).map_err(|error| format!("failed to open osk: {error}"))?;
    let mut archive = zip::ZipArchive::new(file).map_err(|error| format!("failed to read osk archive: {error}"))?;
    for index in 0..archive.len() {
        let mut member = archive.by_index(index).map_err(|error| format!("failed to read archive member: {error}"))?;
        let enclosed = member.enclosed_name().ok_or_else(|| format!("unsafe archive member: {}", member.name()))?.to_owned();
        let out_path = target.join(enclosed);
        if member.is_dir() {
            fs::create_dir_all(&out_path).map_err(|error| format!("failed to create archive dir: {error}"))?;
            continue;
        }
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|error| format!("failed to create archive parent: {error}"))?;
        }
        let mut out = File::create(&out_path).map_err(|error| format!("failed to create archive output: {error}"))?;
        std::io::copy(&mut member, &mut out).map_err(|error| format!("failed to extract archive member: {error}"))?;
    }
    Ok(())
}

fn copy_source_to_raw(source_path: &str, target_raw: &Path) -> Result<usize, String> {
    let source = PathBuf::from(source_path);
    if source.is_dir() {
        return copy_dir_all(&source, target_raw);
    }
    if source.is_file() && source.extension().and_then(|value| value.to_str()).map(|value| value.eq_ignore_ascii_case("osk")).unwrap_or(false) {
        extract_osk(&source, target_raw)?;
        return Ok(walk_relative_files(target_raw)?.len());
    }
    Err(format!("source must be an .osk file or extracted skin folder: {source_path}"))
}

fn rebuild_structured(raw_root: &Path, structured_root: &Path) -> Result<usize, String> {
    // Native migration keeps the original flat files and creates a conservative structured mirror.
    // Fine-grained semantic classification remains in TypeScript via @tenzyu/osu-skin-core.
    copy_dir_all(raw_root, structured_root)
}

fn main_source_manifest(name: &str, source_path: &str, created_at: &str) -> SourceManifest {
    SourceManifest {
        id: MAIN_SOURCE_ID.into(),
        name: format!("{name} (main)"),
        source_path: source_path.into(),
        created_at: created_at.into(),
        readonly: Some(true),
    }
}

fn ensure_main_source(manifest: &mut ProjectManifest) {
    if manifest.sources.iter().any(|source| source.id == MAIN_SOURCE_ID) {
        return;
    }
    let source = main_source_manifest(&manifest.name, &manifest.main_source_path, &manifest.created_at);
    manifest.sources.insert(0, source);
}

#[tauri::command]
fn list_projects(app: AppHandle) -> Result<Vec<ProjectManifest>, String> {
    let root = projects_root(&app)?;
    let mut projects = Vec::new();
    for entry in fs::read_dir(root).map_err(|error| format!("failed to read projects: {error}"))? {
        let entry = entry.map_err(|error| format!("failed to read project entry: {error}"))?;
        if !entry.file_type().map_err(|error| format!("failed to read project entry type: {error}"))?.is_dir() {
            continue;
        }
        let manifest_path = entry.path().join("manifest.json");
        if !manifest_path.exists() {
            continue;
        }
        let content = fs::read_to_string(manifest_path).map_err(|error| format!("failed to read manifest: {error}"))?;
        let mut manifest: ProjectManifest = serde_json::from_str(&content).map_err(|error| format!("failed to parse manifest: {error}"))?;
        ensure_main_source(&mut manifest);
        projects.push(manifest);
    }
    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(projects)
}

#[tauri::command]
fn create_project(app: AppHandle, input: CreateProjectInput) -> Result<ProjectManifest, String> {
    let source = PathBuf::from(&input.source_path);
    let name = input.name.filter(|value| !value.trim().is_empty()).unwrap_or_else(|| {
        source.file_stem().and_then(|value| value.to_str()).unwrap_or("Skin Project").to_string()
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
fn rename_project(app: AppHandle, project_id: String, name: String) -> Result<ProjectManifest, String> {
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
fn delete_project(app: AppHandle, project_id: String) -> Result<(), String> {
    let dir = project_dir(&app, &project_id)?;
    if dir.exists() {
        fs::remove_dir_all(dir).map_err(|error| format!("failed to delete project: {error}"))?;
    }
    Ok(())
}

#[tauri::command]
fn add_project_source(app: AppHandle, input: AddProjectSourceInput) -> Result<ProjectManifest, String> {
    let mut manifest = read_manifest(&app, &input.project_id)?;
    ensure_main_source(&mut manifest);
    let source = PathBuf::from(&input.source_path);
    let name = input.name.filter(|value| !value.trim().is_empty()).unwrap_or_else(|| {
        source.file_stem().and_then(|value| value.to_str()).unwrap_or("Source Skin").to_string()
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
fn rename_project_source(app: AppHandle, input: RenameProjectSourceInput) -> Result<ProjectManifest, String> {
    let trimmed = input.name.trim();
    if trimmed.is_empty() {
        return Err("source name is required".into());
    }
    let mut manifest = read_manifest(&app, &input.project_id)?;
    ensure_main_source(&mut manifest);
    let source = manifest.sources.iter_mut().find(|source| source.id == input.source_id).ok_or_else(|| format!("unknown source: {}", input.source_id))?;
    source.name = trimmed.into();
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn delete_project_source(app: AppHandle, input: DeleteProjectSourceInput) -> Result<ProjectManifest, String> {
    let mut manifest = read_manifest(&app, &input.project_id)?;
    ensure_main_source(&mut manifest);
    let source = manifest.sources.iter().find(|source| source.id == input.source_id).ok_or_else(|| format!("unknown source: {}", input.source_id))?;
    if source.readonly.unwrap_or(false) {
        return Err("main source cannot be deleted".into());
    }
    manifest.sources.retain(|source| source.id != input.source_id);
    let dir = source_dir(&app, &input.project_id, &input.source_id)?;
    if dir.exists() {
        fs::remove_dir_all(dir).map_err(|error| format!("failed to delete source: {error}"))?;
    }
    write_manifest(&app, &mut manifest)?;
    Ok(manifest)
}

#[tauri::command]
fn get_project_files(app: AppHandle, project_id: String) -> Result<RawProjectFilesResponse, String> {
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
    Ok(RawProjectFilesResponse { project, project_skin_ini, sources })
}

#[tauri::command]
fn rebuild_structured_mirrors(app: AppHandle, project_id: String) -> Result<RebuildStructuredResult, String> {
    let mut manifest = read_manifest(&app, &project_id)?;
    ensure_main_source(&mut manifest);
    let project_file_count = rebuild_structured(&project_raw_dir(&app, &project_id)?, &project_structured_dir(&app, &project_id)?)?;
    let mut source_file_counts = HashMap::new();
    for source in manifest.sources {
        let raw = source_raw_dir(&app, &project_id, &source.id)?;
        let structured = source_structured_dir(&app, &project_id, &source.id)?;
        let count = if raw.exists() { rebuild_structured(&raw, &structured)? } else { 0 };
        source_file_counts.insert(source.id, count);
    }
    Ok(RebuildStructuredResult { project_file_count, source_file_counts })
}

fn remove_project_files(root: &Path, relative_paths: &[String]) -> Result<usize, String> {
    let mut deleted = 0;
    for relative in relative_paths {
        let target = safe_join(root, relative)?;
        if target.exists() {
            fs::remove_file(target).map_err(|error| format!("failed to delete file: {error}"))?;
            deleted += 1;
        }
    }
    Ok(deleted)
}

#[tauri::command]
fn apply_asset_group(app: AppHandle, input: ApplyAssetGroupInput) -> Result<AssetMutationResult, String> {
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
fn delete_asset_group(app: AppHandle, input: DeleteAssetGroupInput) -> Result<AssetMutationResult, String> {
    let project_root = project_raw_dir(&app, &input.project_id)?;
    let deleted_count = remove_project_files(&project_root, &input.project_paths)?;
    let rebuilt_structured_count = rebuild_structured(&project_root, &project_structured_dir(&app, &input.project_id)?)?;
    Ok(AssetMutationResult { copied_count: 0, deleted_count, rebuilt_structured_count })
}

fn is_hd_path(relative: &str) -> bool {
    let lower = relative.to_ascii_lowercase();
    lower.contains("@2x.")
}

fn files_equal(left: &Path, right: &Path) -> bool {
    if !right.exists() {
        return false;
    }
    let left = fs::read(left).unwrap_or_default();
    let right = fs::read(right).unwrap_or_default();
    left == right
}

fn add_dir_to_zip<T: Write + Seek>(writer: &mut zip::ZipWriter<T>, root: &Path) -> Result<usize, String> {
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);
    let mut count = 0;
    for entry in WalkDir::new(root).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let relative = entry.path().strip_prefix(root).map_err(|error| format!("failed to strip zip prefix: {error}"))?;
        let name = normalize_relative_path(relative);
        writer.start_file(name, options).map_err(|error| format!("failed to start zip file: {error}"))?;
        let mut file = File::open(entry.path()).map_err(|error| format!("failed to open file for zip: {error}"))?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|error| format!("failed to read file for zip: {error}"))?;
        writer.write_all(&buffer).map_err(|error| format!("failed to write zip entry: {error}"))?;
        count += 1;
    }
    Ok(count)
}

#[tauri::command]
fn export_project(app: AppHandle, input: ExportProjectInput) -> Result<ExportResult, String> {
    let output_root = exports_root(&app)?.join(&input.project_id);
    if output_root.exists() {
        fs::remove_dir_all(&output_root).map_err(|error| format!("failed to clean export dir: {error}"))?;
    }
    fs::create_dir_all(&output_root).map_err(|error| format!("failed to create export dir: {error}"))?;
    let stage_root = output_root.join("stage");
    fs::create_dir_all(&stage_root).map_err(|error| format!("failed to create export stage: {error}"))?;
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
            ExportPreset::Diff => !files_equal(&PathBuf::from(&file.full_path), &safe_join(&main_root, &file.relative_path)?),
        };
        if !include {
            skipped += 1;
            continue;
        }
        let target = safe_join(&stage_root, &file.relative_path)?;
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|error| format!("failed to create export parent: {error}"))?;
        }
        fs::copy(&file.full_path, target).map_err(|error| format!("failed to stage export file: {error}"))?;
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
    let output = File::create(&output_path).map_err(|error| format!("failed to create export file: {error}"))?;
    let mut writer = zip::ZipWriter::new(output);
    let zip_count = add_dir_to_zip(&mut writer, &stage_root)?;
    writer.finish().map_err(|error| format!("failed to finish export zip: {error}"))?;
    fs::remove_dir_all(stage_root).ok();

    let notes = match input.preset {
        ExportPreset::SdOnly => vec!["Excluded @2x HD assets.".into()],
        ExportPreset::HdOnly => vec!["Included only @2x HD assets.".into()],
        ExportPreset::Diff => vec!["Included only files that differ from the main source snapshot.".into()],
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

#[tauri::command]
fn open_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    let command = ("xdg-open", vec![path]);
    #[cfg(target_os = "macos")]
    let command = ("open", vec![path]);
    #[cfg(target_os = "windows")]
    let command = ("cmd", vec!["/C".into(), "start".into(), path]);

    std::process::Command::new(command.0)
        .args(command.1)
        .spawn()
        .map_err(|error| format!("failed to open path: {error}"))?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            health_check,
            list_projects,
            create_project,
            rename_project,
            delete_project,
            add_project_source,
            rename_project_source,
            delete_project_source,
            get_project_files,
            rebuild_structured_mirrors,
            apply_asset_group,
            delete_asset_group,
            export_project,
            open_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running osu! Skin Workbench");
}
