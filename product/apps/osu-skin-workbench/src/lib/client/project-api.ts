"use client";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { classifySkinFiles } from "@tenzyu/osu-skin-core/lib/classification/skin-classifier";
import { parseSkinIniContext } from "@tenzyu/osu-skin-core/lib/classification/skin-ini-context";
import { buildAssetMatrix } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import { rowSeedsFromClassificationRules } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-seeds";
import { buildAssetTree } from "@tenzyu/osu-skin-core/lib/project/asset-tree-builder";
import { toAssetMatrixDto, toAssetTreeDto } from "@tenzyu/osu-skin-core/lib/shared/asset-dto";
import type {
  AssetMutationResult,
  ExportPreset,
  ExportResult,
  ProjectFilesResponse,
  ProjectManifest,
  RebuildStructuredResult,
} from "@tenzyu/osu-skin-core/lib/shared/project-contract";
import type { ClassifiedSkinAsset } from "@tenzyu/osu-skin-core/lib/domain/skin-asset";

export type RawFileEntry = {
  relativePath: string;
  fullPath: string;
};

export type RawSourceFiles = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
  readonly?: boolean;
  files: RawFileEntry[];
  skinIni?: string | null;
};

export type RawProjectFilesResponse = {
  project: RawFileEntry[];
  projectSkinIni?: string | null;
  sources: RawSourceFiles[];
};

function toDesktopAssetDto(asset: ClassifiedSkinAsset): ClassifiedSkinAsset {
  // Desktop-only app: keep fullPath so the Tauri WebView can preview files through convertFileSrc().
  return asset;
}

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function fileSrc(fullPath: string): string {
  return convertFileSrc(fullPath);
}

export async function chooseSkinPath(): Promise<string | null> {
  const selected = await open({
    title: "Choose osu! skin .osk or extracted skin folder",
    directory: false,
    multiple: false,
    filters: [
      { name: "osu! skin", extensions: ["osk"] },
      { name: "All files", extensions: ["*"] },
    ],
  });

  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected ?? null;
}

export async function chooseSkinDirectory(): Promise<string | null> {
  const selected = await open({
    title: "Choose extracted osu! skin folder",
    directory: true,
    multiple: false,
  });

  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected ?? null;
}

export async function fetchProjects(): Promise<ProjectManifest[]> {
  return await invoke<ProjectManifest[]>("list_projects");
}

export async function createProject(input: {
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("create_project", { input });
}

export async function renameProject(projectId: string, name: string): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("rename_project", { projectId, name });
}

export async function deleteProject(projectId: string): Promise<void> {
  await invoke<void>("delete_project", { projectId });
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  const raw = await invoke<RawProjectFilesResponse>("get_project_files", { projectId });
  const projectContext = raw.projectSkinIni ? parseSkinIniContext(raw.projectSkinIni) : undefined;
  const project = classifySkinFiles(
    raw.project.map((file) => ({
      root: "",
      relativePath: file.relativePath,
      fullPath: file.fullPath,
    })),
    projectContext,
  );

  const sources = raw.sources.map((source) => {
    const context = source.skinIni ? parseSkinIniContext(source.skinIni) : undefined;
    const assets = classifySkinFiles(
      source.files.map((file) => ({
        root: "",
        relativePath: file.relativePath,
        fullPath: file.fullPath,
      })),
      context,
    );

    return {
      id: source.id,
      name: source.name,
      sourcePath: source.sourcePath,
      createdAt: source.createdAt,
      readonly: source.readonly,
      assets,
      tree: buildAssetTree(assets),
    };
  });

  const matrix = buildAssetMatrix({
    project,
    sources: sources.map((source) => ({
      id: source.id,
      label: source.name,
      assets: source.assets,
    })),
    rowSeeds: rowSeedsFromClassificationRules(),
  });

  return {
    project: project.map(toDesktopAssetDto),
    projectTree: toAssetTreeDto(buildAssetTree(project)),
    sources: sources.map((source) => ({
      ...source,
      assets: source.assets.map(toDesktopAssetDto),
      tree: toAssetTreeDto(source.tree),
    })),
    matrix: toAssetMatrixDto(matrix),
  };
}

export async function addProjectSource(input: {
  projectId: string;
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("add_project_source", { input });
}

export async function renameProjectSource(input: {
  projectId: string;
  sourceId: string;
  name: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("rename_project_source", { input });
}

export async function deleteProjectSource(input: {
  projectId: string;
  sourceId: string;
}): Promise<ProjectManifest> {
  return await invoke<ProjectManifest>("delete_project_source", { input });
}

export async function exportProject(input: {
  projectId: string;
  preset: ExportPreset;
}): Promise<ExportResult> {
  return await invoke<ExportResult>("export_project", { input });
}

export async function rebuildStructuredMirrors(projectId: string): Promise<RebuildStructuredResult> {
  return await invoke<RebuildStructuredResult>("rebuild_structured_mirrors", { projectId });
}

export async function applyAssetGroup(input: {
  projectId: string;
  sourceId: string;
  sourcePaths: string[];
  replaceProjectPaths: string[];
}): Promise<AssetMutationResult> {
  return await invoke<AssetMutationResult>("apply_asset_group", { input });
}

export async function deleteAssetGroup(input: {
  projectId: string;
  projectPaths: string[];
}): Promise<AssetMutationResult> {
  return await invoke<AssetMutationResult>("delete_asset_group", { input });
}

export async function openPath(path: string): Promise<void> {
  await invoke<void>("open_path", { path });
}
