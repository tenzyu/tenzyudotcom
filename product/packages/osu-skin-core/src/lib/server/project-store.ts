import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { ProjectManifest } from "../shared/project-contract";
import {
  ensureProjectsRoot,
  projectDir,
  projectManifestPath,
  projectsRoot,
} from "./fs-path";

export async function readManifest(projectId: string): Promise<ProjectManifest> {
  return JSON.parse(await readFile(projectManifestPath(projectId), "utf8")) as ProjectManifest;
}

export async function writeManifest(manifest: ProjectManifest): Promise<void> {
  manifest.updatedAt = new Date().toISOString();

  await mkdir(projectDir(manifest.id), { recursive: true });
  await writeFile(projectManifestPath(manifest.id), JSON.stringify(manifest, null, 2));
}

export async function listProjects(): Promise<ProjectManifest[]> {
  await ensureProjectsRoot();

  const entries = await readdir(projectsRoot(), { withFileTypes: true });
  const projects: ProjectManifest[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const manifestPath = projectManifestPath(entry.name);
    if (!existsSync(manifestPath)) continue;

    projects.push(await readManifest(entry.name));
  }

  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteManifestProject(projectId: string): Promise<void> {
  await rm(projectDir(projectId), { recursive: true, force: true });
}

