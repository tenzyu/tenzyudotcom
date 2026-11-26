"use client";

import {
  chooseSkinFolderPath,
  chooseSkinFilePath,
} from "../lib/tauri/file-dialog.adapter";
import {
  invokeAddProjectSource,
  invokeDeleteProjectSource,
  invokeRenameProjectSource,
} from "../lib/tauri/project-command.adapter";
import type { ProjectManifest } from "@tenzyu/osu-skin-core/contract";

export function useAssetSourceActions(input: {
  project: ProjectManifest | null;
  updateProject: (project: ProjectManifest) => void;
  reloadFiles: (projectId: string) => Promise<unknown>;
  setStatus: (message: string) => void;
  setError: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
}) {
  async function addSource(sourcePath: string, name?: string): Promise<ProjectManifest | null> {
    if (!input.project) {
      input.setError("Select a project first.");
      return null;
    }

    if (!sourcePath.trim()) {
      input.setError("Asset source path is required.");
      return null;
    }

    input.setLoading(true);
    input.setError(null);

    try {
      const nextProject = await invokeAddProjectSource({
        projectId: input.project.id,
        sourcePath,
        name: name || undefined,
      });

      input.updateProject(nextProject);
      await input.reloadFiles(nextProject.id);
      input.setStatus(`Added source to ${nextProject.name}.`);
      return nextProject;
    } catch (err) {
      input.setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      input.setLoading(false);
    }
  }

  async function chooseSourcePath(kind: "file" | "directory" = "file"): Promise<string | null> {
    input.setLoading(true);
    input.setError(null);

    try {
      const selected = kind === "directory" ? await chooseSkinFolderPath() : await chooseSkinFilePath();
      input.setStatus(selected ? "Selected asset source path." : "File picker was cancelled or unavailable.");
      return selected;
    } catch (err) {
      input.setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      input.setLoading(false);
    }
  }

  async function renameSource(sourceId: string, name: string): Promise<void> {
    if (!input.project) return;

    input.setLoading(true);
    input.setError(null);

    try {
      const nextProject = await invokeRenameProjectSource({ projectId: input.project.id, sourceId, name });
      input.updateProject(nextProject);
      await input.reloadFiles(nextProject.id);
      input.setStatus("Asset source renamed.");
    } catch (err) {
      input.setError(err instanceof Error ? err.message : String(err));
    } finally {
      input.setLoading(false);
    }
  }

  async function deleteSource(sourceId: string): Promise<void> {
    if (!input.project) return;

    input.setLoading(true);
    input.setError(null);

    try {
      const nextProject = await invokeDeleteProjectSource({ projectId: input.project.id, sourceId });
      input.updateProject(nextProject);
      await input.reloadFiles(nextProject.id);
      input.setStatus("Asset source deleted.");
    } catch (err) {
      input.setError(err instanceof Error ? err.message : String(err));
    } finally {
      input.setLoading(false);
    }
  }

  return {
    addSource,
    chooseSourcePath,
    renameSource,
    deleteSource,
  };
}
