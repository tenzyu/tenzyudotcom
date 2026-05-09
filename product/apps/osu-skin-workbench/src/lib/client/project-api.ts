"use client";

import type {
  ApiErrorResponse,
  ExportPreset,
  ExportResult,
  ProjectFilesResponse,
  ProjectManifest,
  ProjectResponse,
  ProjectsResponse,
  RebuildStructuredResult,
  AssetMutationResult,
} from "../shared/project-contract";

function isApiError(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

async function readJson<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message = isApiError(json) ? json.error : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return json as T;
}

export async function fetchProjects(): Promise<ProjectManifest[]> {
  return (await readJson<ProjectsResponse>(await fetch("/api/projects"))).projects;
}

export async function createProject(input: {
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  const data = await readJson<ProjectResponse>(
    await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  return data.project;
}

export async function renameProject(projectId: string, name: string): Promise<ProjectManifest> {
  const data = await readJson<ProjectResponse>(
    await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );

  return data.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  await readJson<{ ok: true }>(
    await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    }),
  );
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  return readJson<ProjectFilesResponse>(
    await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`),
  );
}

export async function addProjectSource(input: {
  projectId: string;
  sourcePath: string;
  name?: string;
}): Promise<ProjectManifest> {
  const data = await readJson<ProjectResponse>(
    await fetch(`/api/projects/${encodeURIComponent(input.projectId)}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourcePath: input.sourcePath,
        name: input.name,
      }),
    }),
  );

  return data.project;
}

export async function renameProjectSource(input: {
  projectId: string;
  sourceId: string;
  name: string;
}): Promise<ProjectManifest> {
  const data = await readJson<ProjectResponse>(
    await fetch(
      `/api/projects/${encodeURIComponent(input.projectId)}/sources/${encodeURIComponent(input.sourceId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: input.name }),
      },
    ),
  );

  return data.project;
}

export async function deleteProjectSource(input: {
  projectId: string;
  sourceId: string;
}): Promise<ProjectManifest> {
  const data = await readJson<ProjectResponse>(
    await fetch(
      `/api/projects/${encodeURIComponent(input.projectId)}/sources/${encodeURIComponent(input.sourceId)}`,
      {
        method: "DELETE",
      },
    ),
  );

  return data.project;
}

export async function exportProject(input: {
  projectId: string;
  preset: ExportPreset;
}): Promise<ExportResult> {
  const data = await readJson<{ result: ExportResult }>(
    await fetch(`/api/projects/${encodeURIComponent(input.projectId)}/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ preset: input.preset }),
    }),
  );

  return data.result;
}

export async function chooseSkinPath(): Promise<string | null> {
  const data = await readJson<{ path: string | null }>(
    await fetch("/api/dialog/choose-skin", { method: "POST" }),
  );

  return data.path;
}

export async function rebuildStructuredMirrors(projectId: string): Promise<RebuildStructuredResult> {
  const data = await readJson<{ result: RebuildStructuredResult }>(
    await fetch(`/api/projects/${encodeURIComponent(projectId)}/rebuild-structured`, {
      method: "POST",
    }),
  );

  return data.result;
}

export async function applyAssetGroup(input: {
  projectId: string;
  sourceId: string;
  sourcePaths: string[];
  replaceProjectPaths: string[];
}): Promise<AssetMutationResult> {
  const data = await readJson<{ result: AssetMutationResult }>(
    await fetch(`/api/projects/${encodeURIComponent(input.projectId)}/assets/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceId: input.sourceId,
        sourcePaths: input.sourcePaths,
        replaceProjectPaths: input.replaceProjectPaths,
      }),
    }),
  );

  return data.result;
}

export async function deleteAssetGroup(input: {
  projectId: string;
  projectPaths: string[];
}): Promise<AssetMutationResult> {
  const data = await readJson<{ result: AssetMutationResult }>(
    await fetch(`/api/projects/${encodeURIComponent(input.projectId)}/assets/delete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectPaths: input.projectPaths,
      }),
    }),
  );

  return data.result;
}
