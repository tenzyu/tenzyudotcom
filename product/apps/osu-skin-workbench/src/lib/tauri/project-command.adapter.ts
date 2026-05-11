import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type {
  AssetMutationResult,
  ExportPreset,
  ExportResult,
  ProjectManifest,
  RebuildStructuredResult,
} from "@tenzyu/osu-skin-core/contract";

export function desktopFileSrc(fullPath: string): string {
  return convertFileSrc(fullPath);
}

export async function listProjectManifests(): Promise<ProjectManifest[]> {
  return await invoke<ProjectManifest[]>("list_projects");
}

export async function invokeCreateProject(input: {
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("create_project", { input });
}

export async function invokeRenameProject(projectId: string, name: string): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("rename_project", { projectId, name });
}

export async function invokeDeleteProject(projectId: string): Promise<void> {
  await invoke<void>("delete_project", { projectId });
}

export async function invokeGetProjectFiles<T>(projectId: string): Promise<T> {
  return await invoke<T>("get_project_files", { projectId });
}

export async function invokeAddProjectSource(input: {
  projectId: string;
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("add_project_source", { input });
}

export async function invokeRenameProjectSource(input: {
  projectId: string;
  sourceId: string;
  name: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("rename_project_source", { input });
}

export async function invokeDeleteProjectSource(input: {
  projectId: string;
  sourceId: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("delete_project_source", { input });
}

export async function invokeExportProject(input: {
  projectId: string;
  preset: ExportPreset;
}): Promise<ExportResult> {
  return await invoke<ExportResult>("export_project", { input });
}

export async function invokeRebuildStructuredMirrors(
  projectId: string,
): Promise<RebuildStructuredResult> {
  return await invoke<RebuildStructuredResult>("rebuild_structured_mirrors", { projectId });
}

export async function invokeApplyAssetGroup(input: {
  projectId: string;
  sourceId: string;
  sourcePaths: string[];
  replaceProjectPaths: string[];
}): Promise<AssetMutationResult> {
  return await invoke<AssetMutationResult>("apply_asset_group", { input });
}

export async function invokeDeleteAssetGroup(input: {
  projectId: string;
  projectPaths: string[];
}): Promise<AssetMutationResult> {
  return await invoke<AssetMutationResult>("delete_asset_group", { input });
}

export async function invokeOpenPath(path: string): Promise<void> {
  await invoke<void>("open_path", { path });
}
