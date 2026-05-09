#!/usr/bin/env bun

import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { $ } from "bun";
import type { HistoryEntry, ProjectManifest, SourceManifest } from "./shared/editor-types";
import {
  classifySkinFile,
  classificationRules,
  classificationRuleId,
  copyTreeStructured,
  emptyDir,
  extractArchive,
  flatPathFromStructured,
  kindFor,
  parseSkinIniContext,
  resolveSource,
  safeJoin,
  scopes,
  type SkinClassificationContext,
  structuredPathFor,
  toPosixPath,
  walkFiles
} from "./skin-lib";

const workspaceRoot = process.cwd();
const projectsRoot = path.join(workspaceRoot, "skin-editor-projects");
const exportsRoot = path.join(workspaceRoot, "exports");
const builtStaticRoot = path.join(import.meta.dir, "editor-dist");
const staticRoot = process.env.OSU_SKIN_EDITOR_STATIC_ROOT
  ? path.resolve(workspaceRoot, process.env.OSU_SKIN_EDITOR_STATIC_ROOT)
  : existsSync(builtStaticRoot)
    ? builtStaticRoot
  : path.join(import.meta.dir, "editor-static");

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function text(data: string, status = 200): Response {
  return new Response(data, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

function errorResponse(error: unknown, status = 400): Response {
  return json({ error: error instanceof Error ? error.message : String(error) }, status);
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "skin-project";
}

function timestampId(prefix: string): string {
  return `${prefix}-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
}

function resolveUserPath(input: string): string {
  if (!input || !input.trim()) throw new Error("path is required");
  return path.resolve(workspaceRoot, input.trim());
}

function projectDir(projectId: string): string {
  return safeJoin(projectsRoot, projectId);
}

function projectStructuredDir(projectId: string): string {
  return path.join(projectDir(projectId), "structured");
}

function projectHistoryDir(projectId: string): string {
  return path.join(projectDir(projectId), "history");
}

function projectManifestPath(projectId: string): string {
  return path.join(projectDir(projectId), "manifest.json");
}

async function readManifest(projectId: string): Promise<ProjectManifest> {
  return JSON.parse(await readFile(projectManifestPath(projectId), "utf8")) as ProjectManifest;
}

async function writeManifest(manifest: ProjectManifest): Promise<void> {
  manifest.updatedAt = new Date().toISOString();
  await mkdir(projectDir(manifest.id), { recursive: true });
  await writeFile(projectManifestPath(manifest.id), JSON.stringify(manifest, null, 2));
}

async function recordHistory(manifest: ProjectManifest, action: string, affectedPaths: string[]): Promise<void> {
  const uniquePaths = [...new Set(affectedPaths.map(toPosixPath))].filter(Boolean);
  const id = timestampId(action);
  const historyRoot = path.join(projectHistoryDir(manifest.id), id);
  await mkdir(historyRoot, { recursive: true });
  const manifestBeforePath = `history/${id}/manifest-before.json`;
  await writeFile(path.join(projectDir(manifest.id), manifestBeforePath), JSON.stringify(manifest, null, 2));
  const files: HistoryEntry["files"] = [];
  for (const filePath of uniquePaths) {
    const source = safeJoin(projectStructuredDir(manifest.id), filePath);
    const existed = existsSync(source);
    const backupPath = existed ? `history/${id}/files/${filePath}` : undefined;
    if (backupPath) {
      const target = safeJoin(projectDir(manifest.id), backupPath);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
    files.push({ path: filePath, existed, backupPath });
  }
  manifest.history = [
    ...(manifest.history ?? []),
    { id, action, createdAt: new Date().toISOString(), manifestBeforePath, files }
  ].slice(-50);
}

async function listProjects(): Promise<ProjectManifest[]> {
  await mkdir(projectsRoot, { recursive: true });
  const entries = await readdir(projectsRoot, { withFileTypes: true });
  const projects: ProjectManifest[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = projectManifestPath(entry.name);
    if (!existsSync(manifestPath)) continue;
    projects.push(await readManifest(entry.name));
  }
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function copyRawTree(sourceRoot: string, outputRoot: string): Promise<void> {
  await emptyDir(outputRoot);
  for (const file of await walkFiles(sourceRoot)) {
    const target = safeJoin(outputRoot, file.relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(file.fullPath, target);
  }
}

async function copyDirectoryExact(sourceRoot: string, outputRoot: string): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(sourceRoot, entry.name);
    const target = path.join(outputRoot, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryExact(source, target);
      continue;
    }
    if (!entry.isFile()) continue;
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

async function importSourceInto(sourcePath: string, outputRoot: string): Promise<Record<string, string>> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "osu-skin-editor-"));
  try {
    const sourceRoot = await resolveSource(sourcePath, tempRoot);
    await copyRawTree(sourceRoot, path.join(outputRoot, "raw"));
    await emptyDir(path.join(outputRoot, "structured"));
    return await copyTreeStructured(sourceRoot, path.join(outputRoot, "structured"));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function importMain(sourcePathInput: string, nameInput?: string): Promise<ProjectManifest> {
  const sourcePath = resolveUserPath(sourcePathInput);
  const sourceInfo = await stat(sourcePath).catch(() => null);
  if (!sourceInfo) throw new Error(`source does not exist: ${sourcePath}`);
  const baseName = nameInput?.trim() || path.basename(sourcePath, path.extname(sourcePath));
  const id = `${slugify(baseName)}-${Date.now().toString(36)}`;
  const dir = projectDir(id);
  await emptyDir(dir);
  const files = await importSourceInto(sourcePath, dir);
  const now = new Date().toISOString();
  const manifest: ProjectManifest = {
    id,
    name: baseName,
    mainSourcePath: sourcePath,
    createdAt: now,
    updatedAt: now,
    files,
    sources: []
  };
  const mainSource: SourceManifest = {
    id: "main",
    name: `${baseName} (main)`,
    sourcePath,
    createdAt: now,
    files: await importSourceInto(sourcePath, path.join(dir, "sources", "main"))
  };
  manifest.sources.push(mainSource);
  await writeManifest(manifest);
  return manifest;
}

async function importBackup(sourcePathInput: string): Promise<ProjectManifest> {
  const sourcePath = resolveUserPath(sourcePathInput);
  const tempRoot = await mkdtemp(path.join(tmpdir(), "osu-skin-backup-"));
  try {
    await extractBackup(sourcePath, tempRoot);
    const manifestPath = path.join(tempRoot, "manifest.json");
    if (!existsSync(manifestPath)) throw new Error("backup does not contain manifest.json");
    const backupManifest = JSON.parse(await readFile(manifestPath, "utf8")) as ProjectManifest;
    const id = `${slugify(backupManifest.name || "skin-backup")}-${Date.now().toString(36)}`;
    const target = projectDir(id);
    await emptyDir(target);
    await copyDirectoryExact(tempRoot, target);
    const manifest = await readManifest(id).catch(async () => {
      const copied = JSON.parse(await readFile(projectManifestPath(id), "utf8")) as ProjectManifest;
      return copied;
    });
    manifest.id = id;
    manifest.name = `${backupManifest.name || id} (backup)`;
    manifest.createdAt = new Date().toISOString();
    manifest.updatedAt = new Date().toISOString();
    manifest.exports = undefined;
    await writeManifest(manifest);
    return manifest;
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function extractBackup(source: string, output: string): Promise<void> {
  const sourceInfo = await stat(source).catch(() => null);
  if (!sourceInfo?.isFile()) throw new Error(`backup does not exist: ${source}`);
  await extractArchive(source, output);
}

async function importAsset(projectId: string, sourcePathInput: string, nameInput?: string): Promise<ProjectManifest> {
  const manifest = await readManifest(projectId);
  const sourcePath = resolveUserPath(sourcePathInput);
  const sourceInfo = await stat(sourcePath).catch(() => null);
  if (!sourceInfo) throw new Error(`source does not exist: ${sourcePath}`);
  const baseName = nameInput?.trim() || path.basename(sourcePath, path.extname(sourcePath));
  const source: SourceManifest = {
    id: timestampId(slugify(baseName)),
    name: baseName,
    sourcePath,
    createdAt: new Date().toISOString(),
    files: {}
  };
  source.files = await importSourceInto(sourcePath, path.join(projectDir(projectId), "sources", source.id));
  manifest.sources.push(source);
  await writeManifest(manifest);
  return manifest;
}

async function contextFromManifest(files: Record<string, string>, baseDir: string): Promise<SkinClassificationContext | undefined> {
  const skinIniPath = Object.entries(files).find(([, flatPath]) => flatPath.toLowerCase() === "skin.ini")?.[0];
  if (!skinIniPath) return undefined;
  const fullPath = safeJoin(baseDir, skinIniPath);
  const content = await readFile(fullPath, "utf8").catch(() => "");
  return content ? parseSkinIniContext(content) : undefined;
}

function fileInfoFromManifest(projectId: string, scope: "project" | "source", sourceId: string | undefined, structuredPath: string, flatPath: string, context?: SkinClassificationContext) {
  const resolved = scope === "project"
    ? safeJoin(projectStructuredDir(projectId), structuredPath)
    : safeJoin(path.join(projectDir(projectId), "sources", sourceId ?? "", "structured"), structuredPath);
  const classification = classifySkinFile(flatPath, context);
  return {
    scope,
    sourceId,
    path: structuredPath,
    flatPath,
    ...classification,
    name: path.basename(flatPath),
    url: `/api/projects/${encodeURIComponent(projectId)}/blob?scope=${scope}${sourceId ? `&sourceId=${encodeURIComponent(sourceId)}` : ""}&path=${encodeURIComponent(structuredPath)}`,
    exists: existsSync(resolved)
  };
}

function groupFiles(files: ReturnType<typeof fileInfoFromManifest>[]) {
  const grouped = new Map<string, any>();
  for (const file of files) {
    const scopeNode = grouped.get(file.scope) ?? {
      scope: file.scope,
      categories: new Map<string, any>()
    };
    grouped.set(file.scope, scopeNode);

    const categoryNode = scopeNode.categories.get(file.category) ?? {
      category: file.category,
      groups: new Map<string, any>()
    };
    scopeNode.categories.set(file.category, categoryNode);

    const groupNode = categoryNode.groups.get(file.groupKey) ?? {
      groupKey: file.groupKey,
      groupLabel: file.groupLabel,
      ruleId: file.ruleId,
      componentId: file.componentId,
      requiredLevel: file.requiredLevel,
      scope: file.scope,
      category: file.category,
      kind: file.kind,
      lazerMeaningful: false,
      files: []
    };
    categoryNode.groups.set(file.groupKey, groupNode);
    groupNode.files.push(file);
    if (file.kind === "image") groupNode.kind = "image";
    if (file.lazerMeaningful) groupNode.lazerMeaningful = true;
  }

  return [...grouped.values()].map((scopeNode) => ({
    scope: scopeNode.scope,
    categories: [...scopeNode.categories.values()].map((categoryNode) => ({
      category: categoryNode.category,
      groups: [...categoryNode.groups.values()].map((groupNode) => ({
        ...groupNode,
        files: groupNode.files.sort((a: any, b: any) =>
          (a.sequenceIndex ?? 999999) - (b.sequenceIndex ?? 999999) || a.flatPath.localeCompare(b.flatPath)
        )
      })).sort((a, b) => a.groupLabel.localeCompare(b.groupLabel))
    })).sort((a, b) => a.category.localeCompare(b.category))
  })).sort((a, b) => scopes.indexOf(a.scope) - scopes.indexOf(b.scope));
}

type ValidationWarning = {
  id: string;
  rowKey: string;
  type: string;
  severity: "warning" | "info";
  scope: string;
  category: string;
  group: string;
  side: "project" | "source" | "row";
  message: string;
  ignored?: boolean;
  read?: boolean;
};

type MatrixWarning = {
  type: string;
  message: string;
};

function warningId(parts: Array<string | undefined>): string {
  return parts.map((part) => (part ?? "").toLowerCase().replace(/[^\w.-]+/g, "-")).join(":");
}

function warningType(message: string): string {
  if (message.includes("@2x")) return "hdOnly";
  if (message.includes("animation frames missing")) return "animationGap";
  if (message.includes("missing")) return "missing";
  if (message.includes("skin.ini")) return "skinIniReference";
  return "warning";
}

function sequenceWarnings(files: ReturnType<typeof fileInfoFromManifest>[]): MatrixWarning[] {
  const indexes = files
    .map((file) => file.sequenceIndex)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);
  if (indexes.length <= 1) return [];
  const missing = [];
  for (let index = indexes[0]; index <= indexes[indexes.length - 1]; index += 1) {
    if (!indexes.includes(index)) missing.push(index);
  }
  return missing.length ? [{ type: "animationGap", message: `animation frames missing: ${missing.join(", ")}` }] : [];
}

function resolutionState(files: ReturnType<typeof fileInfoFromManifest>[]) {
  const imageFiles = files.filter((file) => file.kind === "image");
  const hasHd = imageFiles.some((file) => /@2x\./i.test(file.flatPath));
  const hasSd = imageFiles.some((file) => !/@2x\./i.test(file.flatPath));
  return { hasHd, hasSd };
}

function matrixCell(files: ReturnType<typeof fileInfoFromManifest>[]) {
  const { hasHd, hasSd } = resolutionState(files);
  const warnings = [...sequenceWarnings(files)];
  if (hasHd && !hasSd) warnings.push({ type: "hdOnly", message: "@2x exists without SD file" });
  return {
    files,
    missing: files.length === 0,
    hasHd,
    hasSd,
    warnings,
    previewKind: files.some((file) => file.kind === "image")
      ? "image"
      : files.some((file) => file.kind === "audio")
        ? "audio"
        : files[0]?.kind ?? "empty"
  };
}

function buildMatrix(project: ReturnType<typeof fileInfoFromManifest>[], sources: Array<SourceManifest & { files: ReturnType<typeof fileInfoFromManifest>[] }>) {
  const columns = [
    { id: "project", label: "Project", kind: "project" },
    ...sources.map((source) => ({ id: source.id, label: source.name, kind: "source" }))
  ];
  const rowMap = new Map<string, any>();
  const addFiles = (columnId: string, files: ReturnType<typeof fileInfoFromManifest>[]) => {
    for (const file of files) {
      const rowKey = `${file.ruleId}:${file.groupKey}`;
      const row = rowMap.get(rowKey) ?? {
        rowKey,
        ruleId: file.ruleId,
        componentId: file.componentId,
        requiredLevel: file.requiredLevel,
        scope: file.scope,
        category: file.category,
        groupKey: file.groupKey,
        groupLabel: file.groupLabel,
        lazerMeaningful: file.lazerMeaningful,
        cells: Object.fromEntries(columns.map((column) => [column.id, matrixCell([])]))
      };
      rowMap.set(rowKey, row);
      row.cells[columnId] = matrixCell([...(row.cells[columnId]?.files ?? []), file]);
      if (file.lazerMeaningful) row.lazerMeaningful = true;
    }
  };

  addFiles("project", project);
  for (const source of sources) addFiles(source.id, source.files);

  for (const [index, rule] of classificationRules.entries()) {
    const ruleId = classificationRuleId(rule, index);
    const rowKey = `${ruleId}:__rule__`;
    if (rowMap.has(rowKey)) continue;
    rowMap.set(rowKey, {
      rowKey,
      ruleId,
      componentId: rule.componentId ?? `${rule.scope}:${rule.category}`,
      requiredLevel: rule.requiredLevel ?? (rule.lazerMeaningful ? "recommended" : "optional"),
      scope: rule.scope,
      category: rule.category,
      groupKey: "__rule__",
      groupLabel: rule.label,
      lazerMeaningful: rule.lazerMeaningful,
      cells: Object.fromEntries(columns.map((column) => [column.id, matrixCell([])]))
    });
  }

  const rows = [...rowMap.values()].map((row) => {
    const projectCell = row.cells.project;
    const warnings: MatrixWarning[] = [];
    const anySourceHasFiles = columns.some((column) => column.kind === "source" && !row.cells[column.id].missing);
    if (row.lazerMeaningful && projectCell.missing && anySourceHasFiles) warnings.push({ type: "missing", message: "missing in project but available from asset source" });
    if (row.requiredLevel !== "optional" && projectCell.missing && row.groupKey !== "__rule__") warnings.push({ type: "missing", message: `${row.requiredLevel} asset missing in project` });
    return { ...row, warnings };
  }).sort((a, b) =>
    scopes.indexOf(a.scope) - scopes.indexOf(b.scope) ||
    a.category.localeCompare(b.category) ||
    a.groupLabel.localeCompare(b.groupLabel)
  );

  return { columns, rows };
}

function validationForMatrix(matrix: ReturnType<typeof buildMatrix>, project?: ReturnType<typeof fileInfoFromManifest>[], context?: SkinClassificationContext) {
  const warnings: ValidationWarning[] = [];
  for (const row of matrix.rows) {
    for (const warning of row.warnings) {
      const type = typeof warning === "string" ? warningType(warning) : warning.type;
      const message = typeof warning === "string" ? warning : warning.message;
      warnings.push({
        id: warningId([row.rowKey, "row", type, message]),
        rowKey: row.rowKey,
        type,
        severity: "warning",
        scope: row.scope,
        category: row.category,
        group: row.groupLabel,
        side: "row",
        message
      });
    }
    const projectCell = row.cells.project;
    for (const warning of projectCell.warnings) {
      const type = typeof warning === "string" ? warningType(warning) : warning.type;
      const message = typeof warning === "string" ? warning : warning.message;
      warnings.push({
        id: warningId([row.rowKey, "project", type, message]),
        rowKey: row.rowKey,
        type,
        severity: "warning",
        scope: row.scope,
        category: row.category,
        group: row.groupLabel,
        side: "project",
        message
      });
    }
  }
  if (project && context) {
    const existing = new Set(project.map((file) => file.flatPath.toLowerCase()));
    for (const key of context.meaningfulKeys) {
      if (!key.includes(".")) continue;
      const ref = context.referencedClassifications.get(key);
      if (ref?.category === "skin-ini-prefixes") continue;
      const basename = key.split("/").at(-1) ?? key;
      if (!existing.has(key) && !existing.has(basename)) {
        warnings.push({
          id: warningId(["skin-ini", key, "skinIniReference"]),
          rowKey: `skin-ini:${key}`,
          type: "skinIniReference",
          severity: "warning",
          scope: "configs",
          category: "skin-ini-references",
          group: basename,
          side: "project",
          message: "skin.ini references a missing asset"
        });
      }
    }
  }
  return { warnings, count: warnings.length };
}

async function projectFiles(projectId: string) {
  const manifest = await readManifest(projectId);
  const projectContext = await contextFromManifest(manifest.files, projectStructuredDir(projectId));
  const project = Object.entries(manifest.files).map(([structuredPath, flatPath]) =>
    fileInfoFromManifest(projectId, "project", undefined, structuredPath, flatPath, projectContext)
  );
  const sources = [];
  for (const source of manifest.sources) {
    const sourceRoot = path.join(projectDir(projectId), "sources", source.id, "structured");
    const sourceContext = await contextFromManifest(source.files, sourceRoot);
    const files = Object.entries(source.files).map(([structuredPath, flatPath]) =>
      fileInfoFromManifest(projectId, "source", source.id, structuredPath, flatPath, sourceContext)
    );
    sources.push({ ...source, files, grouped: groupFiles(files) });
  }
  const matrix = buildMatrix(project, sources);
  const validation = validationForMatrix(matrix, project, projectContext);
  const warningStates = manifest.warningStates ?? {};
  validation.warnings = validation.warnings.map((warning) => ({ ...warning, ...(warningStates[warning.id] ?? {}) }));
  validation.count = validation.warnings.filter((warning) => !warning.ignored).length;
  return {
    project,
    projectGrouped: groupFiles(project),
    sources,
    matrix,
    validation,
    scopes
  };
}

function scopedBase(projectId: string, scope: string | null, sourceId: string | null): string {
  if (scope === "project") return projectStructuredDir(projectId);
  if (scope === "source" && sourceId) return path.join(projectDir(projectId), "sources", sourceId, "structured");
  throw new Error("invalid file scope");
}

async function readFileContent(projectId: string, url: URL): Promise<Response> {
  const scope = url.searchParams.get("scope");
  const sourceId = url.searchParams.get("sourceId");
  const filePath = url.searchParams.get("path");
  if (!filePath) throw new Error("path is required");
  const target = safeJoin(scopedBase(projectId, scope, sourceId), filePath);
  const kind = kindFor(filePath);
  if (kind !== "text") throw new Error("only text files can be opened in the editor");
  return text(await readFile(target, "utf8"));
}

async function writeFileContent(projectId: string, url: URL, request: Request): Promise<Response> {
  const filePath = url.searchParams.get("path");
  if (!filePath) throw new Error("path is required");
  const body = await readJson<{ content: string }>(request);
  if (kindFor(filePath) !== "text") throw new Error("only text files can be saved in the editor");
  if (filePath.toLowerCase().endsWith(".json")) JSON.parse(body.content);
  const manifest = await readManifest(projectId);
  await recordHistory(manifest, "text-save", [filePath]);
  const target = safeJoin(projectStructuredDir(projectId), filePath);
  await writeFile(target, body.content);
  await writeManifest(manifest);
  return json({ ok: true });
}

async function blobResponse(projectId: string, url: URL): Promise<Response> {
  const scope = url.searchParams.get("scope");
  const sourceId = url.searchParams.get("sourceId");
  const filePath = url.searchParams.get("path");
  if (!filePath) throw new Error("path is required");
  const target = safeJoin(scopedBase(projectId, scope, sourceId), filePath);
  const file = Bun.file(target);
  if (!(await file.exists())) throw new Error("file does not exist");
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp3": "audio/mpeg"
  };
  return new Response(file, {
    headers: { "content-type": contentTypes[ext] ?? "application/octet-stream" }
  });
}

async function mixFiles(projectId: string, request: Request): Promise<Response> {
  const body = await readJson<{
    items: Array<{
      sourceId: string;
      path?: string;
      paths?: string[];
      action: "replace" | "skip" | "rename";
      targetPath?: string;
    }>;
  }>(request);
  const manifest = await readManifest(projectId);
  const affected: string[] = [];
  for (const item of body.items ?? []) {
    if (item.action === "skip") continue;
    const paths = item.paths ?? (item.path ? [item.path] : []);
    for (const itemPath of paths) {
      affected.push(item.action === "rename" && item.targetPath && paths.length === 1 ? item.targetPath : itemPath);
    }
  }
  if (affected.length) await recordHistory(manifest, "mix", affected);
  let changed = 0;
  for (const item of body.items ?? []) {
    if (item.action === "skip") continue;
    const paths = item.paths ?? (item.path ? [item.path] : []);
    const source = manifest.sources.find((candidate) => candidate.id === item.sourceId);
    if (!source) throw new Error(`unknown source: ${item.sourceId}`);
    for (const itemPath of paths) {
      const flatPath = source.files[itemPath] ?? flatPathFromStructured(itemPath);
      const targetStructuredPath = item.action === "rename" && item.targetPath && paths.length === 1 ? item.targetPath : itemPath;
      const sourcePath = safeJoin(path.join(projectDir(projectId), "sources", source.id, "structured"), itemPath);
      const targetPath = safeJoin(projectStructuredDir(projectId), targetStructuredPath);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
      manifest.files[targetStructuredPath] = item.action === "rename" ? flatPathFromStructured(targetStructuredPath) : flatPath;
      changed += 1;
    }
  }
  await writeManifest(manifest);
  return json({ ok: true, changed });
}

async function deleteSource(projectId: string, sourceId: string): Promise<Response> {
  const manifest = await readManifest(projectId);
  const before = manifest.sources.length;
  manifest.sources = manifest.sources.filter((source) => source.id !== sourceId);
  if (manifest.sources.length === before) throw new Error(`unknown source: ${sourceId}`);
  await rm(path.join(projectDir(projectId), "sources", sourceId), { recursive: true, force: true });
  await writeManifest(manifest);
  return json({ ok: true });
}

async function deleteProjectFile(projectId: string, url: URL): Promise<Response> {
  const filePath = url.searchParams.get("path");
  if (!filePath) throw new Error("path is required");
  const manifest = await readManifest(projectId);
  if (!manifest.files[filePath]) throw new Error(`unknown project file: ${filePath}`);
  await recordHistory(manifest, "delete", [filePath]);
  delete manifest.files[filePath];
  await rm(safeJoin(projectStructuredDir(projectId), filePath), { force: true });
  await writeManifest(manifest);
  return json({ ok: true });
}

async function restoreFromSource(projectId: string, request: Request): Promise<Response> {
  const body = await readJson<{ sourceId?: string; paths: string[] }>(request);
  const manifest = await readManifest(projectId);
  const source = manifest.sources.find((candidate) => candidate.id === (body.sourceId ?? "main"));
  if (!source) throw new Error(`unknown source: ${body.sourceId ?? "main"}`);
  const paths = [...new Set(body.paths ?? [])].filter(Boolean);
  if (!paths.length) throw new Error("paths are required");
  await recordHistory(manifest, "restore", paths);
  for (const sourceStructuredPath of paths) {
    const flatPath = source.files[sourceStructuredPath] ?? flatPathFromStructured(sourceStructuredPath);
    const targetStructuredPath = sourceStructuredPath;
    const sourcePath = safeJoin(path.join(projectDir(projectId), "sources", source.id, "structured"), sourceStructuredPath);
    const targetPath = safeJoin(projectStructuredDir(projectId), targetStructuredPath);
    if (!existsSync(sourcePath)) continue;
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
    manifest.files[targetStructuredPath] = flatPath;
  }
  await writeManifest(manifest);
  return json({ ok: true, changed: paths.length });
}

async function reclassifyProject(projectId: string): Promise<Response> {
  const manifest = await readManifest(projectId);
  const preview = await reclassifyPlan(projectId, manifest);
  const oldPaths = Object.keys(manifest.files);
  await recordHistory(manifest, "reclassify", oldPaths);
  const tempRoot = path.join(projectDir(projectId), `.reclassify-${Date.now().toString(36)}`);
  await emptyDir(tempRoot);
  const nextFiles: Record<string, string> = {};
  for (const { oldStructuredPath, nextStructuredPath, flatPath } of preview.entries) {
    const source = safeJoin(projectStructuredDir(projectId), oldStructuredPath);
    if (!existsSync(source)) continue;
    const target = safeJoin(tempRoot, nextStructuredPath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    nextFiles[nextStructuredPath] = flatPath;
  }
  const swapRoot = path.join(projectDir(projectId), `.structured-old-${Date.now().toString(36)}`);
  await rename(projectStructuredDir(projectId), swapRoot).catch(async () => {
    await mkdir(projectStructuredDir(projectId), { recursive: true });
  });
  await rename(tempRoot, projectStructuredDir(projectId));
  await rm(swapRoot, { recursive: true, force: true });
  manifest.files = nextFiles;
  await writeManifest(manifest);
  return json({ ok: true, files: Object.keys(nextFiles).length, preview });
}

async function reclassifyPlan(projectId: string, manifest?: ProjectManifest) {
  manifest ??= await readManifest(projectId);
  const context = await contextFromManifest(manifest.files, projectStructuredDir(projectId));
  const entries = [];
  let changed = 0;
  let unchanged = 0;
  let missing = 0;
  for (const [oldStructuredPath, flatPath] of Object.entries(manifest.files)) {
    const nextStructuredPath = structuredPathFor(flatPath, context);
    const oldParts = oldStructuredPath.split("/");
    const nextParts = nextStructuredPath.split("/");
    const exists = existsSync(safeJoin(projectStructuredDir(projectId), oldStructuredPath));
    if (!exists) missing += 1;
    else if (oldStructuredPath === nextStructuredPath) unchanged += 1;
    else changed += 1;
    entries.push({
      oldStructuredPath,
      nextStructuredPath,
      flatPath,
      exists,
      changed: oldStructuredPath !== nextStructuredPath,
      oldScope: oldParts[0] ?? "",
      oldCategory: oldParts[1] ?? "",
      oldGroup: oldParts[2] ?? "",
      newScope: nextParts[0] ?? "",
      newCategory: nextParts[1] ?? "",
      newGroup: nextParts[2] ?? ""
    });
  }
  const moves = new Map<string, number>();
  for (const entry of entries.filter((entry) => entry.changed)) {
    const key = `${entry.oldScope}/${entry.oldCategory} -> ${entry.newScope}/${entry.newCategory}`;
    moves.set(key, (moves.get(key) ?? 0) + 1);
  }
  return {
    changed,
    unchanged,
    missing,
    moves: [...moves.entries()].map(([move, count]) => ({ move, count })).sort((a, b) => b.count - a.count).slice(0, 12),
    examples: entries.filter((entry) => entry.changed).slice(0, 20),
    entries
  };
}

async function reclassifyPreview(projectId: string): Promise<Response> {
  const plan = await reclassifyPlan(projectId);
  const { entries: _entries, ...publicPlan } = plan;
  return json(publicPlan);
}

async function undoProject(projectId: string): Promise<Response> {
  const manifest = await readManifest(projectId);
  const entry = manifest.history?.at(-1);
  if (!entry) throw new Error("nothing to undo");
  const manifestBefore = JSON.parse(await readFile(safeJoin(projectDir(projectId), entry.manifestBeforePath), "utf8")) as ProjectManifest;
  if (entry.action === "reclassify") {
    await emptyDir(projectStructuredDir(projectId));
  }
  for (const file of entry.files) {
    const target = safeJoin(projectStructuredDir(projectId), file.path);
    if (file.existed && file.backupPath) {
      const backup = safeJoin(projectDir(projectId), file.backupPath);
      if (existsSync(backup)) {
        await mkdir(path.dirname(target), { recursive: true });
        await copyFile(backup, target);
      }
    } else {
      await rm(target, { force: true });
    }
  }
  await writeManifest(manifestBefore);
  return json({ ok: true, undone: entry.action, affectedCount: entry.files.length });
}

async function validationResponse(projectId: string): Promise<Response> {
  const files = await projectFiles(projectId);
  return json(files.validation);
}

async function historyResponse(projectId: string): Promise<Response> {
  const manifest = await readManifest(projectId);
  return json((manifest.history ?? []).slice(-20).reverse().map((entry) => ({
    id: entry.id,
    action: entry.action,
    createdAt: entry.createdAt,
    affectedCount: entry.files.length,
    label: `${entry.action} ${entry.files.length} files`
  })));
}

async function updateWarningState(projectId: string, request: Request): Promise<Response> {
  const body = await readJson<{ id: string; ignored?: boolean; read?: boolean }>(request);
  if (!body.id) throw new Error("warning id is required");
  const manifest = await readManifest(projectId);
  manifest.warningStates ??= {};
  manifest.warningStates[body.id] = {
    ...(manifest.warningStates[body.id] ?? {}),
    ...(typeof body.ignored === "boolean" ? { ignored: body.ignored } : {}),
    ...(typeof body.read === "boolean" ? { read: body.read } : {})
  };
  await writeManifest(manifest);
  return json({ ok: true, state: manifest.warningStates[body.id] });
}

async function chooseSkin(url: URL): Promise<Response> {
  const kind = url.searchParams.get("kind") === "directory" ? "directory" : "file";
  const commands = kind === "directory"
    ? [
        ["zenity", "--file-selection", "--directory", "--title=Choose skin folder"],
        ["kdialog", "--getexistingdirectory", workspaceRoot]
      ]
    : [
        ["zenity", "--file-selection", "--title=Choose .osk or backup file", "--file-filter=osu skin archives (*.osk *.zip) | *.osk *.zip"],
        ["kdialog", "--getopenfilename", workspaceRoot, "*.osk *.zip|osu skin archives and backups"]
      ];
  for (const command of commands) {
    try {
      const proc = Bun.spawn(command, { stdout: "pipe", stderr: "ignore" });
      const output = await new Response(proc.stdout).text();
      const code = await proc.exited;
      if (code !== 0) continue;
      const selected = output.trim();
      if (selected) return json({ path: selected });
    } catch {
      continue;
    }
  }
  return json({ path: "" });
}

type ExportRequest = {
  preset?: "full" | "sd" | "hd" | "diff" | "backup";
  formats?: Array<"flat" | "osk" | "diff" | "backup">;
  resolution?: "full" | "sd" | "hd";
  includeStable?: boolean;
  includeExtras?: boolean;
};

function exportSettings(input?: ExportRequest): Required<ExportRequest> {
  const preset = input?.preset ?? "full";
  const defaults: Record<NonNullable<ExportRequest["preset"]>, Required<Pick<ExportRequest, "formats" | "resolution" | "includeStable" | "includeExtras">>> = {
    full: { formats: ["flat", "osk"], resolution: "full", includeStable: true, includeExtras: true },
    sd: { formats: ["flat", "osk"], resolution: "sd", includeStable: true, includeExtras: true },
    hd: { formats: ["flat", "osk"], resolution: "hd", includeStable: true, includeExtras: true },
    diff: { formats: ["diff"], resolution: "full", includeStable: true, includeExtras: true },
    backup: { formats: ["backup"], resolution: "full", includeStable: true, includeExtras: true }
  };
  return {
    preset,
    formats: input?.formats ?? defaults[preset].formats,
    resolution: input?.resolution ?? defaults[preset].resolution,
    includeStable: input?.includeStable ?? defaults[preset].includeStable,
    includeExtras: input?.includeExtras ?? defaults[preset].includeExtras
  };
}

function shouldExportFile(flatPath: string, structuredPath: string, settings: Required<ExportRequest>): boolean {
  if (settings.resolution === "sd" && /@2x\./i.test(flatPath)) return false;
  if (settings.resolution === "hd" && kindFor(flatPath) === "image" && !/@2x\./i.test(flatPath)) return false;
  const classification = classifySkinFile(flatPath);
  if (!settings.includeStable && classification.scope === "stable") return false;
  if (!settings.includeExtras && classification.scope === "extras") return false;
  return Boolean(structuredPath);
}

async function exportFlatFiles(projectId: string, manifest: ProjectManifest, outputRoot: string, settings: Required<ExportRequest>, diffOnly: boolean): Promise<number> {
  await emptyDir(outputRoot);
  const mainFiles = manifest.sources.find((source) => source.id === "main")?.files ?? {};
  let count = 0;
  for (const [structuredPath, flatPath] of Object.entries(manifest.files)) {
    if (!shouldExportFile(flatPath, structuredPath, settings)) continue;
    if (diffOnly && mainFiles[structuredPath] === flatPath) continue;
    const source = safeJoin(projectStructuredDir(projectId), structuredPath);
    if (!existsSync(source)) continue;
    const target = safeJoin(outputRoot, flatPath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    count += 1;
  }
  return count;
}

async function exportProject(projectId: string, request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({})) as ExportRequest;
  const settings = exportSettings(body);
  const manifest = await readManifest(projectId);
  const flatDir = path.join(exportsRoot, manifest.id, "flat");
  const diffDir = path.join(exportsRoot, manifest.id, "diff");
  const oskPath = path.join(exportsRoot, `${manifest.id}.osk`);
  const backupPath = path.join(exportsRoot, `${manifest.id}.backup.zip`);
  await mkdir(exportsRoot, { recursive: true });
  await recordHistory(manifest, "export", []);
  const exports: ProjectManifest["exports"] = {};
  const counts: Record<string, number> = {};
  if (settings.formats.includes("flat") || settings.formats.includes("osk")) {
    counts.flat = await exportFlatFiles(projectId, manifest, flatDir, settings, false);
    exports.flat = path.relative(workspaceRoot, flatDir);
  }
  if (settings.formats.includes("osk")) {
    await rm(oskPath, { force: true });
    await $`zip -qr ${oskPath} .`.cwd(flatDir);
    exports.osk = path.relative(workspaceRoot, oskPath);
    counts.osk = counts.flat ?? 0;
  }
  if (settings.formats.includes("diff")) {
    counts.diff = await exportFlatFiles(projectId, manifest, diffDir, settings, true);
    exports.diff = path.relative(workspaceRoot, diffDir);
  }
  if (settings.formats.includes("backup")) {
    await rm(backupPath, { force: true });
    await $`zip -qr ${backupPath} .`.cwd(projectDir(projectId));
    exports.backup = path.relative(workspaceRoot, backupPath);
    counts.backup = Object.keys(manifest.files).length;
  }
  manifest.exports = exports;
  await writeManifest(manifest);
  const resultSummary = Object.entries(exports).map(([format, outputPath]) => ({
    format,
    path: outputPath,
    count: counts[format] ?? (format === "osk" ? counts.flat : 0)
  }));
  return json({
    ok: true,
    exports: manifest.exports,
    counts,
    settings,
    resultSummary,
    validation: (await projectFiles(projectId)).validation
  });
}

function routeProject(pathname: string): { projectId: string; action: string } | null {
  const match = pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.+))?$/);
  if (!match) return null;
  return { projectId: decodeURIComponent(match[1]), action: match[2] ?? "" };
}

async function handleApi(request: Request, url: URL): Promise<Response> {
  if (url.pathname === "/api/health") return json({ ok: true, workspaceRoot });
  if (url.pathname === "/api/dialog/choose-skin" && request.method === "POST") return chooseSkin(url);
  if (url.pathname === "/api/projects" && request.method === "GET") return json(await listProjects());
  if (url.pathname === "/api/projects/import-main" && request.method === "POST") {
    const body = await readJson<{ sourcePath: string; name?: string }>(request);
    return json(await importMain(body.sourcePath, body.name));
  }
  if (url.pathname === "/api/projects/import-backup" && request.method === "POST") {
    const body = await readJson<{ sourcePath: string }>(request);
    return json(await importBackup(body.sourcePath));
  }

  const projectRoute = routeProject(url.pathname);
  if (!projectRoute) return errorResponse("not found", 404);
  const { projectId, action } = projectRoute;

  if (action === "" && request.method === "GET") return json(await readManifest(projectId));
  if (action === "import-assets" && request.method === "POST") {
    const body = await readJson<{ sourcePath: string; name?: string }>(request);
    return json(await importAsset(projectId, body.sourcePath, body.name));
  }
  if (action === "files" && request.method === "GET") return json(await projectFiles(projectId));
  if (action === "file" && request.method === "GET") return readFileContent(projectId, url);
  if (action === "file" && request.method === "PUT") return writeFileContent(projectId, url, request);
  if (action === "file" && request.method === "DELETE") return deleteProjectFile(projectId, url);
  if (action === "blob" && request.method === "GET") return blobResponse(projectId, url);
  if (action === "mix" && request.method === "POST") return mixFiles(projectId, request);
  if (action === "restore" && request.method === "POST") return restoreFromSource(projectId, request);
  if (action === "history" && request.method === "GET") return historyResponse(projectId);
  if (action === "reclassify-preview" && request.method === "POST") return reclassifyPreview(projectId);
  if (action === "reclassify" && request.method === "POST") return reclassifyProject(projectId);
  if (action === "undo" && request.method === "POST") return undoProject(projectId);
  if (action === "validation" && request.method === "GET") return validationResponse(projectId);
  if (action === "warning-state" && request.method === "POST") return updateWarningState(projectId, request);
  if (action === "export" && request.method === "POST") return exportProject(projectId, request);
  const sourceDelete = action.match(/^sources\/([^/]+)$/);
  if (sourceDelete && request.method === "DELETE") return deleteSource(projectId, decodeURIComponent(sourceDelete[1]));

  return errorResponse("not found", 404);
}

async function staticResponse(url: URL): Promise<Response> {
  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const target = safeJoin(staticRoot, requested);
  const file = Bun.file(target);
  if (!(await file.exists())) return text("not found", 404);
  const ext = path.extname(target).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
  };
  return new Response(file, {
    headers: { "content-type": contentTypes[ext] ?? "application/octet-stream" },
  });
}

async function findPort(start: number): Promise<number> {
  for (let port = start; port < start + 50; port += 1) {
    try {
      const server = Bun.serve({ port, fetch: () => new Response("ok") });
      server.stop(true);
      return port;
    } catch {
      continue;
    }
  }
  throw new Error(`no free port found starting at ${start}`);
}

async function openBrowser(url: string): Promise<void> {
  try {
    await $`xdg-open ${url}`.quiet();
  } catch {
    console.error(`Open this URL: ${url}`);
  }
}

async function main() {
  const parsed = parseArgs({
    args: process.argv.slice(2),
    options: {
      port: { type: "string", default: "8771" },
      open: { type: "boolean", default: true },
      "no-open": { type: "boolean", default: false },
      check: { type: "boolean", default: false }
    }
  });
  if (parsed.values.check) {
    for (const file of ["index.html"]) {
      const target = path.join(staticRoot, file);
      if (!existsSync(target)) throw new Error(`missing static file: ${target}`);
    }
    console.log("editor check passed");
    return;
  }
  await mkdir(projectsRoot, { recursive: true });
  await mkdir(exportsRoot, { recursive: true });

  const port = await findPort(Number(parsed.values.port ?? 8771));
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port,
    async fetch(request) {
      const url = new URL(request.url);
      try {
        if (url.pathname.startsWith("/api/")) return await handleApi(request, url);
        return await staticResponse(url);
      } catch (error) {
        return errorResponse(error, 400);
      }
    }
  });
  const url = `http://${server.hostname}:${server.port}/`;
  console.log(`osu! skin editor running at ${url}`);
  if (parsed.values.open && !parsed.values["no-open"]) await openBrowser(url);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
