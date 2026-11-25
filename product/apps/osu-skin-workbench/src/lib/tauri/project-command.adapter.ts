import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type {
  AssetMutationResult,
  CreateProjectInput,
  AddProjectSourceInput,
  RenameProjectSourceInput,
  DeleteProjectSourceInput,
  ExportProjectInput,
  ApplyAssetGroupInput,
  DeleteAssetGroupInput,
  ExportResult,
  ProjectManifest,
  RebuildStructuredResult,
  RawProjectFilesResponse,
} from "@tenzyu/osu-skin-core/contract";

export function desktopFileSrc(fullPath: string): string {
  return convertFileSrc(fullPath);
}

export async function listProjectManifests(): Promise<ProjectManifest[]> {
  return await invoke<ProjectManifest[]>("list_projects");
}

export async function invokeCreateProject(input: CreateProjectInput): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("create_project", { input });
}

export async function invokeRenameProject(projectId: string, name: string): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("rename_project", { projectId, name });
}

export async function invokeDeleteProject(projectId: string): Promise<void> {
  await invoke<void>("delete_project", { projectId });
}

export async function invokeGetProjectFiles(projectId: string): Promise<RawProjectFilesResponse> {
  return await invoke<RawProjectFilesResponse>("get_project_files", { projectId });
}

export async function invokeAddProjectSource(input: AddProjectSourceInput): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("add_project_source", { input });
}

export async function invokeRenameProjectSource(input: RenameProjectSourceInput): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("rename_project_source", { input });
}

export async function invokeDeleteProjectSource(input: DeleteProjectSourceInput): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("delete_project_source", { input });
}

export async function invokeExportProject(input: ExportProjectInput): Promise<ExportResult> {
  return await invoke<ExportResult>("export_project", { input });
}

export async function invokeRebuildStructuredMirrors(
  projectId: string,
): Promise<RebuildStructuredResult> {
  return await invoke<RebuildStructuredResult>("rebuild_structured_mirrors", { projectId });
}

export async function invokeApplyAssetGroup(input: ApplyAssetGroupInput): Promise<AssetMutationResult> {
  return await invoke<AssetMutationResult>("apply_asset_group", { input });
}

export async function invokeDeleteAssetGroup(input: DeleteAssetGroupInput): Promise<AssetMutationResult> {
  return await invoke<AssetMutationResult>("delete_asset_group", { input });
}

export async function invokeOpenProjectDir(projectId: string): Promise<void> {
  await invoke<void>("open_project_dir", { projectId });
}

export async function invokeOpenExportDir(projectId: string): Promise<void> {
  await invoke<void>("open_export_dir", { projectId });
}

export async function invokeOpenExportFile(projectId: string, fileName: string): Promise<void> {
  await invoke<void>("open_export_file", { projectId, fileName });
}
