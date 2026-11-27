"use client";

import { useState } from "react";
import { listProjectManifests } from "../lib/tauri/project-command.adapter";
import type { ProjectManifest } from "@tenzyu/osu-skin-core/contract";

export function useProjects(initialProjectId: string) {
  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const project = projects.find((item) => item.id === selectedId) ?? null;

  async function refreshProjects(options: {
    loadFiles?: (projectId: string) => Promise<unknown>;
  } = {}): Promise<ProjectManifest[]> {
    const nextProjects = await listProjectManifests();
    setProjects(nextProjects);

    if (!project || !nextProjects.some((item) => item.id === project.id)) {
      const nextId = nextProjects.some((item) => item.id === initialProjectId)
        ? initialProjectId
        : nextProjects[0]?.id;
      setSelectedId(nextId ?? null);
      if (nextId) await options.loadFiles?.(nextId);
    }

    return nextProjects;
  }

  async function selectProject(
    projectId: string,
    options: { loadFiles?: (projectId: string) => Promise<unknown> } = {},
  ): Promise<void> {
    if (!projects.some((item) => item.id === projectId)) return;
    setSelectedId(projectId);
    await options.loadFiles?.(projectId);
  }

  function insertProject(nextProject: ProjectManifest): void {
    setProjects((current) => [
      nextProject,
      ...current.filter((item) => item.id !== nextProject.id),
    ]);
    setSelectedId(nextProject.id);
  }

  function updateProject(nextProject: ProjectManifest): void {
    setProjects((current) => current.map((item) => (item.id === nextProject.id ? nextProject : item)));
  }

  return {
    projects,
    project,
    refreshProjects,
    selectProject,
    insertProject,
    updateProject,
  };
}
