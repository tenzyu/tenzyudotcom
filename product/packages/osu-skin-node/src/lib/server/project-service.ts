import path from "node:path";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

import { classifySkinAsset } from "@tenzyu/osu-skin-core/lib/classification/skin-classifier";
import { skinContextForRoot } from "./skin-context";
import type { ClassifiedSkinAsset } from "@tenzyu/osu-skin-core/lib/domain/skin-asset";
import { buildAssetMatrix } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import { buildAssetTree } from "@tenzyu/osu-skin-core/lib/project/asset-tree-builder";
import { rowSeedsFromClassificationRules } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-seeds";
import { structuredPathForAsset } from "@tenzyu/osu-skin-core/lib/project/structured-path-codec";
import {
  toAssetMatrixDto,
  toAssetTreeDto,
  toSkinAssetDto,
} from "@tenzyu/osu-skin-core/lib/shared/asset-dto";
import type {
  ExportPreset,
  ExportResult,
  ProjectFilesResponse,
  ProjectManifest,
  RebuildStructuredResult,
  AssetMutationResult,
  SourceManifest,
} from "@tenzyu/osu-skin-core/lib/shared/project-contract";

import { copyTree, copyTreeFiltered, emptyDir, walkRelativeFiles, withResolvedSkinSource, zipDirectory } from "./archive";
import {
  exportDir,
  exportsRoot,
  newEntityId,
  projectDir,
  projectRawDir,
  projectStructuredDir,
  resolveUserPath,
  safeJoin,
  slugify,
  sourceDir,
  sourceRawDir,
  sourceStructuredDir,
} from "./fs-path";
import {
  deleteManifestProject,
  readManifest,
  writeManifest,
} from "./project-store";

const mainSourceId = "main";

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

async function rebuildStructuredMirror(rawRoot: string, structuredRoot: string): Promise<number> {
  const assets = await classifyRoot(rawRoot);

  await emptyDir(structuredRoot);

  for (const asset of assets) {
    const target = safeJoin(structuredRoot, structuredPathForAsset(asset));

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(asset.file.fullPath, target);
  }

  return assets.length;
}

function mainSourceManifest(input: {
  name: string;
  sourcePath: string;
  createdAt: string;
}): SourceManifest {
  return {
    id: mainSourceId,
    name: `${input.name} (main)`,
    sourcePath: input.sourcePath,
    createdAt: input.createdAt,
    readonly: true,
  };
}

function ensureMainSource(manifest: ProjectManifest): ProjectManifest {
  if (manifest.sources.some((source) => source.id === mainSourceId)) {
    return manifest;
  }

  return {
    ...manifest,
    sources: [
      mainSourceManifest({
        name: manifest.name,
        sourcePath: manifest.mainSourcePath,
        createdAt: manifest.createdAt,
      }),
      ...manifest.sources,
    ],
  };
}

export async function createProject(input: {
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  const sourcePath = resolveUserPath(input.sourcePath);
  const baseName = input.name?.trim() || path.basename(sourcePath, path.extname(sourcePath));
  const id = newEntityId(slugify(baseName));
  const now = new Date().toISOString();

  await withResolvedSkinSource(sourcePath, async (sourceRoot) => {
    await copyTree(sourceRoot, projectRawDir(id));
    await rebuildStructuredMirror(projectRawDir(id), projectStructuredDir(id));
    await copyTree(sourceRoot, sourceRawDir(id, mainSourceId));
    await rebuildStructuredMirror(sourceRawDir(id, mainSourceId), sourceStructuredDir(id, mainSourceId));
  });

  const manifest: ProjectManifest = {
    id,
    name: baseName,
    mainSourcePath: sourcePath,
    createdAt: now,
    updatedAt: now,
    sources: [mainSourceManifest({ name: baseName, sourcePath, createdAt: now })],
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
  const sourceId = newEntityId(slugify(baseName));

  await withResolvedSkinSource(sourcePath, async (sourceRoot) => {
    await copyTree(sourceRoot, sourceRawDir(input.projectId, sourceId));
    await rebuildStructuredMirror(sourceRawDir(input.projectId, sourceId), sourceStructuredDir(input.projectId, sourceId));
  });

  const nextManifest = ensureMainSource(manifest);
  nextManifest.sources.push({
    id: sourceId,
    name: baseName,
    sourcePath,
    createdAt: new Date().toISOString(),
  });

  await writeManifest(nextManifest);

  return nextManifest;
}

export async function getProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  const manifest = ensureMainSource(await readManifest(projectId));
  const rawRoot = projectRawDir(projectId);

  if (!existsSync(rawRoot)) {
    throw new Error(`project raw files are missing: ${projectId}`);
  }

  if (!existsSync(projectStructuredDir(projectId))) {
    await rebuildStructuredMirror(rawRoot, projectStructuredDir(projectId));
  }

  const project = await classifyRoot(rawRoot);

  const sources = await Promise.all(
    manifest.sources.map(async (source) => {
      const root = sourceRawDir(projectId, source.id);
      if (existsSync(root) && !existsSync(sourceStructuredDir(projectId, source.id))) {
        await rebuildStructuredMirror(root, sourceStructuredDir(projectId, source.id));
      }
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
    rowSeeds: rowSeedsFromClassificationRules(),
  });

  return {
    project: project.map(toSkinAssetDto),
    projectTree: toAssetTreeDto(buildAssetTree(project)),
    sources: sources.map((source) => ({
      ...source,
      assets: source.assets.map(toSkinAssetDto),
      tree: toAssetTreeDto(source.tree),
    })),
    matrix: toAssetMatrixDto(matrix),
  };
}

export async function ensureProjectExists(projectId: string): Promise<ProjectManifest> {
  const dir = projectDir(projectId);

  if (!existsSync(dir)) {
    throw new Error(`unknown project: ${projectId}`);
  }

  return ensureMainSource(await readManifest(projectId));
}

export async function ensureProjectDirs(projectId: string): Promise<void> {
  await mkdir(projectDir(projectId), { recursive: true });
}

export async function renameProject(projectId: string, name: string): Promise<ProjectManifest> {
  const manifest = ensureMainSource(await readManifest(projectId));
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("project name is required");
  }

  manifest.name = trimmed;
  await writeManifest(manifest);

  return manifest;
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteManifestProject(projectId);
}

export async function renameProjectSource(input: {
  projectId: string;
  sourceId: string;
  name: string;
}): Promise<ProjectManifest> {
  const manifest = ensureMainSource(await readManifest(input.projectId));
  const source = manifest.sources.find((item) => item.id === input.sourceId);
  const trimmed = input.name.trim();

  if (!source) {
    throw new Error(`unknown source: ${input.sourceId}`);
  }

  if (!trimmed) {
    throw new Error("source name is required");
  }

  source.name = trimmed;
  await writeManifest(manifest);

  return manifest;
}

export async function deleteProjectSource(input: {
  projectId: string;
  sourceId: string;
}): Promise<ProjectManifest> {
  const manifest = ensureMainSource(await readManifest(input.projectId));
  const source = manifest.sources.find((item) => item.id === input.sourceId);

  if (!source) {
    throw new Error(`unknown source: ${input.sourceId}`);
  }

  if (source.readonly) {
    throw new Error("main source cannot be deleted");
  }

  manifest.sources = manifest.sources.filter((item) => item.id !== input.sourceId);
  await rm(sourceDir(input.projectId, input.sourceId), {
    recursive: true,
    force: true,
  });
  await writeManifest(manifest);

  return manifest;
}

function isHdPath(relativePath: string): boolean {
  return /@2x\.[^.]+$/i.test(relativePath);
}

async function fileEquals(left: string, right: string): Promise<boolean> {
  if (!existsSync(right)) return false;

  const [leftBuffer, rightBuffer] = await Promise.all([readFile(left), readFile(right)]);
  return leftBuffer.equals(rightBuffer);
}

function exportNotesFor(preset: ExportPreset): string[] {
  switch (preset) {
    case "sd-only":
      return ["Excluded @2x HD assets."];
    case "hd-only":
      return ["Included only @2x HD assets."];
    case "diff":
      return ["Included only files that differ from the main source snapshot."];
    case "backup":
      return ["Included the whole editor project directory, including raw and structured mirrors."];
    case "full":
    default:
      return ["Included all project raw files."];
  }
}

export async function exportProject(input: {
  projectId: string;
  preset?: ExportPreset;
}): Promise<ExportResult> {
  const preset = input.preset ?? "full";
  await ensureProjectExists(input.projectId);
  await mkdir(exportsRoot(), { recursive: true });

  const outputRoot = exportDir(input.projectId);
  const stageRoot = path.join(outputRoot, `${preset}-stage`);
  const outputPath = path.join(
    outputRoot,
    preset === "backup" ? `${input.projectId}.backup.zip` : `${input.projectId}.${preset}.osk`,
  );

  const rawRoot = preset === "backup" ? projectDir(input.projectId) : projectRawDir(input.projectId);
  const mainRoot = sourceRawDir(input.projectId, mainSourceId);

  const { copied, skipped } = await copyTreeFiltered(rawRoot, stageRoot, async (relativePath) => {
    if (preset === "backup") return true;
    if (preset === "sd-only") return !isHdPath(relativePath);
    if (preset === "hd-only") return isHdPath(relativePath);

    if (preset === "diff") {
      return !(await fileEquals(safeJoin(rawRoot, relativePath), safeJoin(mainRoot, relativePath)));
    }

    return true;
  });

  await zipDirectory(stageRoot, outputPath);
  await rm(stageRoot, { recursive: true, force: true });

  return {
    preset,
    outputPath,
    fileCount: copied,
    excludedCount: skipped,
    notes: exportNotesFor(preset),
  };
}

export async function rebuildProjectStructuredMirrors(
  projectId: string,
): Promise<RebuildStructuredResult> {
  const manifest = await ensureProjectExists(projectId);
  const rawRoot = projectRawDir(projectId);

  if (!existsSync(rawRoot)) {
    throw new Error(`project raw files are missing: ${projectId}`);
  }

  const projectFileCount = await rebuildStructuredMirror(rawRoot, projectStructuredDir(projectId));
  const sourceFileCounts: Record<string, number> = {};

  for (const source of manifest.sources) {
    const sourceRoot = sourceRawDir(projectId, source.id);

    sourceFileCounts[source.id] = existsSync(sourceRoot)
      ? await rebuildStructuredMirror(sourceRoot, sourceStructuredDir(projectId, source.id))
      : 0;
  }

  return {
    projectFileCount,
    sourceFileCounts,
  };
}

async function deleteProjectFiles(projectId: string, relativePaths: string[]): Promise<number> {
  let deletedCount = 0;

  for (const relativePath of relativePaths) {
    const target = safeJoin(projectRawDir(projectId), relativePath);

    if (!existsSync(target)) continue;

    await rm(target, { force: true });
    deletedCount += 1;
  }

  return deletedCount;
}

export async function applyAssetGroupToProject(input: {
  projectId: string;
  sourceId: string;
  sourcePaths: string[];
  replaceProjectPaths?: string[];
}): Promise<AssetMutationResult> {
  await ensureProjectExists(input.projectId);

  if (!input.sourcePaths.length) {
    throw new Error("sourcePaths is required");
  }

  const sourceRoot = sourceRawDir(input.projectId, input.sourceId);
  if (!existsSync(sourceRoot)) {
    throw new Error(`unknown source: ${input.sourceId}`);
  }

  const deletedCount = await deleteProjectFiles(input.projectId, input.replaceProjectPaths ?? []);
  let copiedCount = 0;

  for (const relativePath of input.sourcePaths) {
    const source = safeJoin(sourceRoot, relativePath);
    const target = safeJoin(projectRawDir(input.projectId), relativePath);

    if (!existsSync(source)) {
      throw new Error(`source file is missing: ${relativePath}`);
    }

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    copiedCount += 1;
  }

  const rebuiltStructuredCount = await rebuildStructuredMirror(
    projectRawDir(input.projectId),
    projectStructuredDir(input.projectId),
  );

  return {
    copiedCount,
    deletedCount,
    rebuiltStructuredCount,
  };
}

export async function deleteAssetGroupFromProject(input: {
  projectId: string;
  projectPaths: string[];
}): Promise<AssetMutationResult> {
  await ensureProjectExists(input.projectId);

  if (!input.projectPaths.length) {
    throw new Error("projectPaths is required");
  }

  const deletedCount = await deleteProjectFiles(input.projectId, input.projectPaths);
  const rebuiltStructuredCount = await rebuildStructuredMirror(
    projectRawDir(input.projectId),
    projectStructuredDir(input.projectId),
  );

  return {
    copiedCount: 0,
    deletedCount,
    rebuiltStructuredCount,
  };
}

