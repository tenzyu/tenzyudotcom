use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub(crate) const MAIN_SOURCE_ID: &str = "main";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SourceManifest {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) source_path: String,
    pub(crate) created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) readonly: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectManifest {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) main_source_path: String,
    pub(crate) created_at: String,
    pub(crate) updated_at: String,
    pub(crate) sources: Vec<SourceManifest>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreateProjectInput {
    pub(crate) source_path: String,
    pub(crate) name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AddProjectSourceInput {
    pub(crate) project_id: String,
    pub(crate) source_path: String,
    pub(crate) name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RenameProjectSourceInput {
    pub(crate) project_id: String,
    pub(crate) source_id: String,
    pub(crate) name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DeleteProjectSourceInput {
    pub(crate) project_id: String,
    pub(crate) source_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RawFileEntry {
    pub(crate) relative_path: String,
    pub(crate) full_path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RawSourceFiles {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) source_path: String,
    pub(crate) created_at: String,
    pub(crate) readonly: Option<bool>,
    pub(crate) files: Vec<RawFileEntry>,
    pub(crate) skin_ini: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RawProjectFilesResponse {
    pub(crate) project: Vec<RawFileEntry>,
    pub(crate) project_skin_ini: Option<String>,
    pub(crate) sources: Vec<RawSourceFiles>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RebuildStructuredResult {
    pub(crate) project_file_count: usize,
    pub(crate) source_file_counts: HashMap<String, usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AssetMutationResult {
    pub(crate) copied_count: usize,
    pub(crate) deleted_count: usize,
    pub(crate) rebuilt_structured_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub(crate) enum ExportPreset {
    Full,
    SdOnly,
    HdOnly,
    Diff,
    Backup,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ExportProjectInput {
    pub(crate) project_id: String,
    pub(crate) preset: ExportPreset,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ExportResult {
    pub(crate) preset: ExportPreset,
    pub(crate) output_path: String,
    pub(crate) file_count: usize,
    pub(crate) excluded_count: usize,
    pub(crate) notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApplyAssetGroupInput {
    pub(crate) project_id: String,
    pub(crate) source_id: String,
    pub(crate) source_paths: Vec<String>,
    pub(crate) replace_project_paths: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DeleteAssetGroupInput {
    pub(crate) project_id: String,
    pub(crate) project_paths: Vec<String>,
}
