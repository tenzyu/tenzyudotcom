import { mkdir } from "node:fs/promises";
import path from "node:path";

export function workspaceRoot(): string {
  return process.cwd();
}

export function projectsRoot(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "skin-editor-projects");
}

export function exportsRoot(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "exports");
}

export function toPosixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return slug || "skin-project";
}

export function timestampId(prefix: string): string {
  return newEntityId(prefix);
}

export function newEntityId(prefix: string): string {
  const time = new Date().toISOString().replace(/\D/g, "").slice(0, 17);
  const entropy =
    globalThis.crypto?.randomUUID?.().split("-")[0] ??
    Math.random().toString(36).slice(2, 10);

  return `${prefix}-${time}-${entropy}`;
}

export function resolveUserPath(input: string): string {
  const value = input.trim();

  if (!value) {
    throw new Error("path is required");
  }

  return path.resolve(/* turbopackIgnore: true */ process.cwd(), value);
}

export function safeJoin(root: string, relativePath: string): string {
  const normalized = toPosixPath(relativePath);

  if (path.isAbsolute(relativePath) || normalized.split("/").includes("..")) {
    throw new Error(`unsafe path: ${relativePath}`);
  }

  const target = path.resolve(root, normalized);
  const resolvedRoot = path.resolve(root);

  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`path escapes root: ${relativePath}`);
  }

  return target;
}

export function projectDir(projectId: string): string {
  return safeJoin(projectsRoot(), projectId);
}

export function projectManifestPath(projectId: string): string {
  return path.join(projectDir(projectId), "manifest.json");
}

export function projectRawDir(projectId: string): string {
  return path.join(projectDir(projectId), "project", "raw");
}

export function projectStructuredDir(projectId: string): string {
  return path.join(projectDir(projectId), "project", "structured");
}

export function sourceDir(projectId: string, sourceId: string): string {
  return path.join(/* turbopackIgnore: true */ projectDir(projectId), "sources", sourceId);
}

export function sourceRawDir(projectId: string, sourceId: string): string {
  return path.join(sourceDir(projectId, sourceId), "raw");
}

export function sourceStructuredDir(projectId: string, sourceId: string): string {
  return path.join(sourceDir(projectId, sourceId), "structured");
}

export function exportDir(projectId: string): string {
  return safeJoin(exportsRoot(), projectId);
}

export async function ensureProjectsRoot(): Promise<void> {
  await mkdir(projectsRoot(), { recursive: true });
}
