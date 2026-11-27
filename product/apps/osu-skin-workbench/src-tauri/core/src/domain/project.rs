use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub(crate) const MAIN_SOURCE_ID: &str = "main";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub(crate) struct SourceManifest {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) source_path: String,
    pub(crate) created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[cfg_attr(test, ts(optional))]
    pub(crate) readonly: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct ProjectManifest {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) main_source_path: String,
    pub(crate) created_at: String,
    pub(crate) updated_at: String,
    pub(crate) sources: Vec<SourceManifest>,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub(crate) source_path: String,
    #[cfg_attr(test, ts(optional = nullable))]
    pub(crate) name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct AddProjectSourceInput {
    pub(crate) project_id: String,
    pub(crate) source_path: String,
    #[cfg_attr(test, ts(optional = nullable))]
    pub(crate) name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct RenameProjectSourceInput {
    pub(crate) project_id: String,
    pub(crate) source_id: String,
    pub(crate) name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct DeleteProjectSourceInput {
    pub(crate) project_id: String,
    pub(crate) source_id: String,
}

#[derive(Debug, Serialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub(crate) struct RawFileEntry {
    pub(crate) relative_path: String,
    pub(crate) full_path: String,
}

#[derive(Debug, Serialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
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
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct RawProjectFilesResponse {
    pub(crate) project: Vec<RawFileEntry>,
    pub(crate) project_skin_ini: Option<String>,
    pub(crate) sources: Vec<RawSourceFiles>,
}

#[derive(Debug, Serialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct RebuildStructuredResult {
    #[cfg_attr(test, ts(type = "number"))]
    pub(crate) project_file_count: usize,
    #[cfg_attr(test, ts(type = "Record<string, number>"))]
    pub(crate) source_file_counts: HashMap<String, usize>,
}

#[derive(Debug, Serialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct AssetMutationResult {
    #[cfg_attr(test, ts(type = "number"))]
    pub(crate) copied_count: usize,
    #[cfg_attr(test, ts(type = "number"))]
    pub(crate) deleted_count: usize,
    #[cfg_attr(test, ts(type = "number"))]
    pub(crate) rebuilt_structured_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "kebab-case")]
pub(crate) enum ExportPreset {
    Full,
    SdOnly,
    HdOnly,
    Diff,
    Backup,
}

impl ExportPreset {
    pub(crate) const ALL: [Self; 5] = [
        Self::Full,
        Self::SdOnly,
        Self::HdOnly,
        Self::Diff,
        Self::Backup,
    ];

    pub(crate) fn file_name(self, project_id: &str) -> String {
        let suffix = match self {
            Self::Full => "full.osk",
            Self::SdOnly => "sd-only.osk",
            Self::HdOnly => "hd-only.osk",
            Self::Diff => "diff.osk",
            Self::Backup => "backup.zip",
        };
        format!("{project_id}.{suffix}")
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct ExportProjectInput {
    pub(crate) project_id: String,
    pub(crate) preset: ExportPreset,
}

#[derive(Debug, Serialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub(crate) preset: ExportPreset,
    pub(crate) output_path: String,
    #[cfg_attr(test, ts(type = "number"))]
    pub(crate) file_count: usize,
    #[cfg_attr(test, ts(type = "number"))]
    pub(crate) excluded_count: usize,
    pub(crate) notes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct ApplyAssetGroupInput {
    pub(crate) project_id: String,
    pub(crate) source_id: String,
    pub(crate) source_paths: Vec<String>,
    #[cfg_attr(test, ts(optional = nullable))]
    pub(crate) replace_project_paths: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(test, derive(ts_rs::TS))]
#[serde(rename_all = "camelCase")]
pub struct DeleteAssetGroupInput {
    pub(crate) project_id: String,
    pub(crate) project_paths: Vec<String>,
}

#[cfg(test)]
mod wire_contract {
    use super::*;
    use ts_rs::{Config, TS};

    #[test]
    fn export_wire_contract() {
        let Some(path) = std::env::var_os("SKIN_IPC_EXPORT") else { return };
        let config = Config::default();
        let declarations = [
            SourceManifest::decl(&config),
            ProjectManifest::decl(&config),
            CreateProjectInput::decl(&config),
            AddProjectSourceInput::decl(&config),
            RenameProjectSourceInput::decl(&config),
            DeleteProjectSourceInput::decl(&config),
            RawFileEntry::decl(&config),
            RawSourceFiles::decl(&config),
            RawProjectFilesResponse::decl(&config),
            RebuildStructuredResult::decl(&config),
            AssetMutationResult::decl(&config),
            ExportPreset::decl(&config),
            ExportProjectInput::decl(&config),
            ExportResult::decl(&config),
            ApplyAssetGroupInput::decl(&config),
            DeleteAssetGroupInput::decl(&config),
        ];
        let output = declarations.into_iter().map(|decl| format!("export {decl}\n")).collect::<String>();
        std::fs::write(path, output).expect("write TypeScript wire contract");
    }
}
