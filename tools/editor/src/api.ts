import type {
  ExportResult,
  HistoryEntrySummary,
  ProjectFilesResponse,
  ProjectManifest,
} from "../../shared/editor-types";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    headers: options.body instanceof FormData ? undefined : { "content-type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const data = await response.json() as { error?: string };
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }
  const type = response.headers.get("content-type") || "";
  return (type.includes("application/json") ? await response.json() : await response.text()) as T;
}

export const editorApi = {
  health: () => api<{ ok: true; workspaceRoot: string }>("/api/health"),
  projects: () => api<ProjectManifest[]>("/api/projects"),
  project: (projectId: string) => api<ProjectManifest>(`/api/projects/${encodeURIComponent(projectId)}`),
  files: (projectId: string) => api<ProjectFilesResponse>(`/api/projects/${encodeURIComponent(projectId)}/files`),
  history: (projectId: string) => api<HistoryEntrySummary[]>(`/api/projects/${encodeURIComponent(projectId)}/history`),
  importMain: (sourcePath: string, name: string) => api<ProjectManifest>("/api/projects/import-main", {
    method: "POST",
    body: JSON.stringify({ sourcePath, name }),
  }),
  importBackup: (sourcePath: string) => api<ProjectManifest>("/api/projects/import-backup", {
    method: "POST",
    body: JSON.stringify({ sourcePath }),
  }),
  importAssets: (projectId: string, sourcePath: string, name: string) =>
    api<ProjectManifest>(`/api/projects/${encodeURIComponent(projectId)}/import-assets`, {
      method: "POST",
      body: JSON.stringify({ sourcePath, name }),
    }),
  chooseSkin: (kind: "file" | "directory") => api<{ path: string }>(`/api/dialog/choose-skin?kind=${kind}`, {
    method: "POST",
    body: "{}",
  }),
  deleteSource: (projectId: string, sourceId: string) =>
    api<{ ok: true }>(`/api/projects/${encodeURIComponent(projectId)}/sources/${encodeURIComponent(sourceId)}`, { method: "DELETE" }),
  deleteFile: (projectId: string, path: string) =>
    api<{ ok: true }>(`/api/projects/${encodeURIComponent(projectId)}/file?path=${encodeURIComponent(path)}`, { method: "DELETE" }),
  readText: (projectId: string, path: string) =>
    api<string>(`/api/projects/${encodeURIComponent(projectId)}/file?scope=project&path=${encodeURIComponent(path)}`),
  writeText: (projectId: string, path: string, content: string) =>
    api<{ ok: true }>(`/api/projects/${encodeURIComponent(projectId)}/file?path=${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  mix: (projectId: string, items: Array<{ sourceId: string; paths: string[]; action: "replace" | "skip" }>) =>
    api<{ ok: true; changed: number }>(`/api/projects/${encodeURIComponent(projectId)}/mix`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  restore: (projectId: string, sourceId: string, paths: string[]) =>
    api<{ ok: true; changed: number }>(`/api/projects/${encodeURIComponent(projectId)}/restore`, {
      method: "POST",
      body: JSON.stringify({ sourceId, paths }),
    }),
  reclassifyPreview: (projectId: string) =>
    api<{
      changed: number;
      unchanged: number;
      missing: number;
      moves: Array<{ move: string; count: number }>;
      examples: Array<{
        flatPath: string;
        oldScope: string;
        oldCategory: string;
        oldGroup: string;
        newScope: string;
        newCategory: string;
        newGroup: string;
      }>;
    }>(`/api/projects/${encodeURIComponent(projectId)}/reclassify-preview`, { method: "POST", body: "{}" }),
  reclassify: (projectId: string) =>
    api<{ ok: true }>(`/api/projects/${encodeURIComponent(projectId)}/reclassify`, { method: "POST", body: "{}" }),
  undo: (projectId: string) =>
    api<{ ok: true; undone: string; affectedCount: number }>(`/api/projects/${encodeURIComponent(projectId)}/undo`, { method: "POST", body: "{}" }),
  warningState: (projectId: string, id: string, ignored: boolean) =>
    api<{ ok: true }>(`/api/projects/${encodeURIComponent(projectId)}/warning-state`, {
      method: "POST",
      body: JSON.stringify({ id, ignored, read: true }),
    }),
  exportProject: (
    projectId: string,
    body: { preset: string; formats: string[]; resolution: string; includeStable: boolean; includeExtras: boolean },
  ) => api<ExportResult>(`/api/projects/${encodeURIComponent(projectId)}/export`, {
    method: "POST",
    body: JSON.stringify(body),
  }),
};
