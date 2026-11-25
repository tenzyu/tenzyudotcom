"use client";

import { classifySkinFiles } from "@tenzyu/osu-skin-core/classification";
import { parseSkinIniContext } from "@tenzyu/osu-skin-core/classification";
import { buildAssetMatrix } from "@tenzyu/osu-skin-core/project";
import { rowSeedsFromClassificationRules } from "@tenzyu/osu-skin-core/project";
import { buildAssetTree } from "@tenzyu/osu-skin-core/project";
import {
  toDesktopAssetMatrixDto,
  toDesktopAssetTreeDto,
  toDesktopSkinAssetDto,
} from "@tenzyu/osu-skin-core/contract";
import type { DesktopProjectFilesResponse } from "@tenzyu/osu-skin-core/contract";
import { invokeGetProjectFiles } from "../tauri/project-command.adapter";

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

// Preserve the existing application API without a second implementation of IPC forwarding.
export {
  chooseSkinFilePath as chooseSkinFile,
  chooseSkinFilePath as chooseSkinPath,
  chooseSkinFolderPath as chooseSkinDirectory,
} from "../tauri/file-dialog.adapter";
export {
  listProjectManifests as fetchProjects,
  invokeCreateProject as createProject,
  invokeRenameProject as renameProject,
  invokeDeleteProject as deleteProject,
  invokeAddProjectSource as addProjectSource,
  invokeRenameProjectSource as renameProjectSource,
  invokeDeleteProjectSource as deleteProjectSource,
  invokeExportProject as exportProject,
  invokeRebuildStructuredMirrors as rebuildStructuredMirrors,
  invokeApplyAssetGroup as applyAssetGroup,
  invokeDeleteAssetGroup as deleteAssetGroup,
} from "../tauri/project-command.adapter";

export async function fetchProjectFiles(projectId: string): Promise<DesktopProjectFilesResponse> {
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
    project: project.map(toDesktopSkinAssetDto),
    projectTree: toDesktopAssetTreeDto(buildAssetTree(project)),
    sources: sources.map((source) => ({
      ...source,
      assets: source.assets.map(toDesktopSkinAssetDto),
      tree: toDesktopAssetTreeDto(source.tree),
    })),
    matrix: toDesktopAssetMatrixDto(matrix),
  };
}
