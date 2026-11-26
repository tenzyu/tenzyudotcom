import { classifySkinFiles } from "../classification/skin-classifier";
import { parseSkinIniContext } from "../classification/skin-ini-context";
import { buildAssetMatrix } from "./asset-matrix-builder";
import { rowSeedsFromClassificationRules } from "./asset-matrix-seeds";
import { buildAssetTree } from "./asset-tree-builder";
import { toDesktopAssetMatrixDto, toDesktopAssetTreeDto, toDesktopSkinAssetDto } from "../shared/asset-dto";
import type { DesktopProjectFilesResponse, RawFileEntry, RawProjectFilesResponse } from "../shared/project-contract";

function classify(files: RawFileEntry[], skinIni?: string | null) {
  return classifySkinFiles(
    files.map(file => ({ root: "", relativePath: file.relativePath, fullPath: file.fullPath })),
    skinIni ? parseSkinIniContext(skinIni) : undefined,
  );
}

export function projectWorkspace(raw: RawProjectFilesResponse): DesktopProjectFilesResponse {
  const project = classify(raw.project, raw.projectSkinIni);

  const sources = raw.sources.map((source) => {
    const assets = classify(source.files, source.skinIni);

    return {
      id: source.id,
      name: source.name,
      sourcePath: source.sourcePath,
      createdAt: source.createdAt,
      readonly: source.readonly ?? undefined,
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
