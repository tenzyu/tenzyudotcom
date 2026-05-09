import path from "node:path";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

import { classificationRules } from "../classification/classification-rules";
import { classifySkinAsset } from "../classification/skin-classifier";
import { skinContextForRoot } from "../classification/skin-ini-context";
import type { ClassifiedSkinAsset } from "../domain/skin-asset";
import { buildAssetMatrix, type AssetMatrixRowSeed } from "../project/asset-matrix-builder";
import { buildAssetTree } from "../project/asset-tree-builder";

import { copyTree, walkRelativeFiles, withResolvedSkinSource } from "./archive";
import {
  projectDir,
  projectRawDir,
  resolveUserPath,
  slugify,
  sourceRawDir,
  timestampId,
} from "./fs-path";
import {
  readManifest,
  writeManifest,
  type ProjectManifest,
  type SourceManifest,
} from "./project-store";

export type ProjectFilesResponse = {
  project: ClassifiedSkinAsset[];
  projectTree: ReturnType<typeof buildAssetTree>;
  sources: Array<SourceManifest & { assets: ClassifiedSkinAsset[]; tree: ReturnType<typeof buildAssetTree> }>;
  matrix: ReturnType<typeof buildAssetMatrix>;
};

function rowSeedsFromRules(): AssetMatrixRowSeed[] {
  return classificationRules.map((rule) => ({
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
    taxonomyPath: rule.path,
    groupKey: rule.path.groupId,
    kind: rule.kind,
    meaning: rule.meaning,
  }));
}

async function classifyRoot(root: string): Promise<ClassifiedSkinAsset[]> {
  const context = await skinContextForRoot(root);
  const files = await walkRelativeFiles(root);

  return files.map((relativePath) =>
    classifySkinAsset({
      root,
      relativePath,
      fullPath: path.join(root, relativePath),
      context,
    }),
  );
}

export async function createProject(input: {
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  const sourcePath = resolveUserPath(input.sourcePath);
  const baseName = input.name?.trim() || path.basename(sourcePath, path.extname(sourcePath));
  const id = `${slugify(baseName)}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  await withResolvedSkinSource(sourcePath, async (sourceRoot) => {
    await copyTree(sourceRoot, projectRawDir(id));
  });

  const manifest: ProjectManifest = {
    id,
    name: baseName,
    mainSourcePath: sourcePath,
    createdAt: now,
    updatedAt: now,
    sources: [],
  };

  await writeManifest(manifest);

  return manifest;
}

export async function addProjectSource(input: {
  projectId: string;
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  const manifest = await readManifest(input.projectId);
  const sourcePath = resolveUserPath(input.sourcePath);
  const baseName = input.name?.trim() || path.basename(sourcePath, path.extname(sourcePath));
  const sourceId = timestampId(slugify(baseName));

  await withResolvedSkinSource(sourcePath, async (sourceRoot) => {
    await copyTree(sourceRoot, sourceRawDir(input.projectId, sourceId));
  });

  manifest.sources.push({
    id: sourceId,
    name: baseName,
    sourcePath,
    createdAt: new Date().toISOString(),
  });

  await writeManifest(manifest);

  return manifest;
}

export async function getProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  const manifest = await readManifest(projectId);
  const rawRoot = projectRawDir(projectId);

  if (!existsSync(rawRoot)) {
    throw new Error(`project raw files are missing: ${projectId}`);
  }

  const project = await classifyRoot(rawRoot);

  const sources = await Promise.all(
    manifest.sources.map(async (source) => {
      const root = sourceRawDir(projectId, source.id);
      const assets = existsSync(root) ? await classifyRoot(root) : [];

      return {
        ...source,
        assets,
        tree: buildAssetTree(assets),
      };
    }),
  );

  const matrix = buildAssetMatrix({
    project,
    sources: sources.map((source) => ({
      id: source.id,
      label: source.name,
      assets: source.assets,
    })),
    rowSeeds: rowSeedsFromRules(),
  });

  return {
    project,
    projectTree: buildAssetTree(project),
    sources,
    matrix,
  };
}

export async function ensureProjectExists(projectId: string): Promise<ProjectManifest> {
  const dir = projectDir(projectId);

  if (!existsSync(dir)) {
    throw new Error(`unknown project: ${projectId}`);
  }

  return readManifest(projectId);
}

export async function ensureProjectDirs(projectId: string): Promise<void> {
  await mkdir(projectDir(projectId), { recursive: true });
}