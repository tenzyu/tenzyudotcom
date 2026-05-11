"use client";

import {
  addProjectSource,
  chooseSkinPath,
  deleteProjectSource,
  renameProjectSource,
} from "../lib/client/project-api";
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
      const nextProject = await addProjectSource({
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

  async function chooseSourcePath(): Promise<string | null> {
    input.setLoading(true);
    input.setError(null);

    try {
      const selected = await chooseSkinPath();
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
      const nextProject = await renameProjectSource({ projectId: input.project.id, sourceId, name });
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
      const nextProject = await deleteProjectSource({ projectId: input.project.id, sourceId });
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
