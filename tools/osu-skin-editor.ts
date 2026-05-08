#!/usr/bin/env bun

import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { $ } from "bun";
import {
  classifySkinFile,
  copyTreeStructured,
  emptyDir,
  flatPathFromStructured,
  kindFor,
  resolveSource,
  safeJoin,
  scopes,
  toPosixPath,
  walkFiles
} from "./skin-lib";

type SourceManifest = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
  files: Record<string, string>;
};

type ProjectManifest = {
  id: string;
  name: string;
  mainSourcePath: string;
  createdAt: string;
  updatedAt: string;
  files: Record<string, string>;
  sources: SourceManifest[];
  exports?: {
    flat?: string;
    osk?: string;
  };
};

const workspaceRoot = process.cwd();
const projectsRoot = path.join(workspaceRoot, "skin-editor-projects");
const exportsRoot = path.join(workspaceRoot, "exports");
const staticRoot = path.join(import.meta.dir, "editor-static");

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

function fileInfoFromManifest(projectId: string, scope: "project" | "source", sourceId: string | undefined, structuredPath: string, flatPath: string) {
  const resolved = scope === "project"
    ? safeJoin(projectStructuredDir(projectId), structuredPath)
    : safeJoin(path.join(projectDir(projectId), "sources", sourceId ?? "", "structured"), structuredPath);
  const classification = classifySkinFile(flatPath);
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
      scope: file.scope,
      category: file.category,
      kind: file.kind,
      files: []
    };
    categoryNode.groups.set(file.groupKey, groupNode);
    groupNode.files.push(file);
    if (file.kind === "image") groupNode.kind = "image";
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

async function projectFiles(projectId: string) {
  const manifest = await readManifest(projectId);
  const project = Object.entries(manifest.files).map(([structuredPath, flatPath]) =>
    fileInfoFromManifest(projectId, "project", undefined, structuredPath, flatPath)
  );
  const sources = manifest.sources.map((source) => {
    const files = Object.entries(source.files).map(([structuredPath, flatPath]) =>
      fileInfoFromManifest(projectId, "source", source.id, structuredPath, flatPath)
    );
    return { ...source, files, grouped: groupFiles(files) };
  });
  return {
    project,
    projectGrouped: groupFiles(project),
    sources,
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
  const target = safeJoin(projectStructuredDir(projectId), filePath);
  await writeFile(target, body.content);
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
  return new Response(file);
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
  delete manifest.files[filePath];
  await rm(safeJoin(projectStructuredDir(projectId), filePath), { force: true });
  await writeManifest(manifest);
  return json({ ok: true });
}

async function chooseSkin(url: URL): Promise<Response> {
  const kind = url.searchParams.get("kind") === "directory" ? "directory" : "file";
  const commands = kind === "directory"
    ? [
        ["zenity", "--file-selection", "--directory", "--title=Choose skin folder"],
        ["kdialog", "--getexistingdirectory", workspaceRoot]
      ]
    : [
        ["zenity", "--file-selection", "--title=Choose .osk file", "--file-filter=osu skin archives (*.osk) | *.osk"],
        ["kdialog", "--getopenfilename", workspaceRoot, "*.osk|osu skin archives"]
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

async function exportProject(projectId: string): Promise<Response> {
  const manifest = await readManifest(projectId);
  const flatDir = path.join(exportsRoot, manifest.id, "flat");
  const oskPath = path.join(exportsRoot, `${manifest.id}.osk`);
  await emptyDir(flatDir);
  await mkdir(exportsRoot, { recursive: true });
  await rm(oskPath, { force: true });
  for (const [structuredPath, flatPath] of Object.entries(manifest.files)) {
    const source = safeJoin(projectStructuredDir(projectId), structuredPath);
    if (!existsSync(source)) continue;
    const target = safeJoin(flatDir, flatPath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  await $`zip -qr ${oskPath} .`.cwd(flatDir);
  manifest.exports = {
    flat: path.relative(workspaceRoot, flatDir),
    osk: path.relative(workspaceRoot, oskPath)
  };
  await writeManifest(manifest);
  return json({ ok: true, exports: manifest.exports });
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
  if (action === "export" && request.method === "POST") return exportProject(projectId);
  const sourceDelete = action.match(/^sources\/([^/]+)$/);
  if (sourceDelete && request.method === "DELETE") return deleteSource(projectId, decodeURIComponent(sourceDelete[1]));

  return errorResponse("not found", 404);
}

async function staticResponse(url: URL): Promise<Response> {
  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const target = safeJoin(staticRoot, requested);
  const file = Bun.file(target);
  if (!(await file.exists())) return text("not found", 404);
  return new Response(file);
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
    for (const file of ["index.html", "styles.css", "app.js"]) {
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
