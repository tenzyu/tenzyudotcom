"use client";

import { classifySkinFiles } from "@tenzyu/osu-skin-core/classification";
import { parseSkinIniContext } from "@tenzyu/osu-skin-core/classification";
import { buildAssetMatrix } from "@tenzyu/osu-skin-core/project";
import { rowSeedsFromClassificationRules } from "@tenzyu/osu-skin-core/project";
import { buildAssetTree } from "@tenzyu/osu-skin-core/project";
import { toAssetMatrixDto, toAssetTreeDto } from "@tenzyu/osu-skin-core/contract";
import type {
  AssetMutationResult,
  ExportPreset,
  ExportResult,
  ProjectFilesResponse,
  ProjectManifest,
  RebuildStructuredResult,
} from "@tenzyu/osu-skin-core/contract";
import type { ClassifiedSkinAsset } from "@tenzyu/osu-skin-core/domain";
import { chooseSkinFilePath, chooseSkinFolderPath } from "../tauri/file-dialog.adapter";
import {
  desktopFileSrc,
  invokeAddProjectSource,
  invokeApplyAssetGroup,
  invokeCreateProject,
  invokeDeleteAssetGroup,
  invokeDeleteProject,
  invokeDeleteProjectSource,
  invokeExportProject,
  invokeGetProjectFiles,
  invokeOpenPath,
  invokeRebuildStructuredMirrors,
  invokeRenameProject,
  invokeRenameProjectSource,
  listProjectManifests,
} from "../tauri/project-command.adapter";

type RawFileEntry = {
  relativePath: string;
  fullPath: string;
};

type RawSourceFiles = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
  readonly?: boolean;
  files: RawFileEntry[];
  skinIni?: string | null;
};

type RawProjectFilesResponse = {
  project: RawFileEntry[];
  projectSkinIni?: string | null;
  sources: RawSourceFiles[];
};

function toDesktopAssetDto(asset: ClassifiedSkinAsset): ClassifiedSkinAsset {
  // Desktop-only app: keep fullPath so the Tauri WebView can preview files through convertFileSrc().
  return asset;
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function fileSrc(fullPath: string): string {
  return desktopFileSrc(fullPath);
}

export async function chooseSkinPath(): Promise<string | null> {
  return chooseSkinFilePath();
}

async function chooseSkinDirectory(): Promise<string | null> {
  return chooseSkinFolderPath();
}

export async function fetchProjects(): Promise<ProjectManifest[]> {
  return await listProjectManifests();
}

export async function createProject(input: {
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  return await invokeCreateProject(input);
}

export async function renameProject(projectId: string, name: string): Promise<ProjectManifest> {
  return await invokeRenameProject(projectId, name);
}

export async function deleteProject(projectId: string): Promise<void> {
  await invokeDeleteProject(projectId);
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  const raw = await invokeGetProjectFiles<RawProjectFilesResponse>(projectId);
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
  return await invokeAddProjectSource(input);
}

export async function renameProjectSource(input: {
  projectId: string;
  sourceId: string;
  name: string;
}): Promise<ProjectManifest> {
  return await invokeRenameProjectSource(input);
}

export async function deleteProjectSource(input: {
  projectId: string;
  sourceId: string;
}): Promise<ProjectManifest> {
  return await invokeDeleteProjectSource(input);
}

export async function exportProject(input: {
  projectId: string;
  preset: ExportPreset;
}): Promise<ExportResult> {
  return await invokeExportProject(input);
}

export async function rebuildStructuredMirrors(projectId: string): Promise<RebuildStructuredResult> {
  return await invokeRebuildStructuredMirrors(projectId);
}

export async function applyAssetGroup(input: {
  projectId: string;
  sourceId: string;
  sourcePaths: string[];
  replaceProjectPaths: string[];
}): Promise<AssetMutationResult> {
  return await invokeApplyAssetGroup(input);
}

export async function deleteAssetGroup(input: {
  projectId: string;
  projectPaths: string[];
}): Promise<AssetMutationResult> {
  return await invokeDeleteAssetGroup(input);
}

async function openPath(path: string): Promise<void> {
  await invokeOpenPath(path);
}
