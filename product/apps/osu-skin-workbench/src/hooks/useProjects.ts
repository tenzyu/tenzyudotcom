"use client";

import { useState } from "react";
import { fetchProjects } from "../lib/client/project-api";
import type { ProjectManifest } from "@tenzyu/osu-skin-core/lib/shared/project-contract";

export function useProjects(initialProjectId: string) {
  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [project, setProject] = useState<ProjectManifest | null>(null);

  async function refreshProjects(options: {
    loadFiles?: (projectId: string) => Promise<unknown>;
  } = {}): Promise<ProjectManifest[]> {
    const nextProjects = await fetchProjects();
    setProjects(nextProjects);

    if (!project) {
      const nextId = nextProjects.some((item) => item.id === initialProjectId)
        ? initialProjectId
        : nextProjects[0]?.id;

      if (nextId) {
        setProject(nextProjects.find((item) => item.id === nextId) ?? null);
        await options.loadFiles?.(nextId);
      }
    }

    return nextProjects;
  }

  async function selectProject(
    projectId: string,
    options: {
      projectList?: ProjectManifest[];
      loadFiles?: (projectId: string) => Promise<unknown>;
    } = {},
  ): Promise<void> {
    if (!projectId) return;

    const projectList = options.projectList ?? projects;
    setProject(projectList.find((item) => item.id === projectId) ?? null);
    await options.loadFiles?.(projectId);
  }

  function updateProject(nextProject: ProjectManifest): void {
    setProject(nextProject);
    setProjects((current) => current.map((item) => (item.id === nextProject.id ? nextProject : item)));
  }

  return {
    projects,
    project,
    refreshProjects,
    selectProject,
    updateProject,
    setProjects,
    setProject,
  };
}
