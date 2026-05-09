import { mkdir } from "node:fs/promises";
import path from "node:path";

export const workspaceRoot = process.cwd();
export const projectsRoot = path.join(workspaceRoot, "skin-editor-projects");

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
  return `${prefix}-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
}

export function resolveUserPath(input: string): string {
  const value = input.trim();

  if (!value) {
    throw new Error("path is required");
  }

  return path.resolve(workspaceRoot, value);
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
  return safeJoin(projectsRoot, projectId);
}

export function projectManifestPath(projectId: string): string {
  return path.join(projectDir(projectId), "manifest.json");
}

export function projectRawDir(projectId: string): string {
  return path.join(projectDir(projectId), "project", "raw");
}

export function sourceRawDir(projectId: string, sourceId: string): string {
  return path.join(projectDir(projectId), "sources", sourceId, "raw");
}

export async function ensureProjectsRoot(): Promise<void> {
  await mkdir(projectsRoot, { recursive: true });
}