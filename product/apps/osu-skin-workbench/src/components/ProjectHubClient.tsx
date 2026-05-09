"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  chooseSkinPath,
  createProject,
  deleteProject,
  fetchProjects,
  renameProject,
} from "../lib/client/project-api";
import type { ProjectManifest } from "../lib/shared/project-contract";

export function ProjectHubClient() {
  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [projectName, setProjectName] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("No project loaded.");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshProjects();
  }, []);

  async function refreshProjects() {
    setLoading(true);
    setError(null);

    try {
      const nextProjects = await fetchProjects();
      setProjects(nextProjects);
      setStatus(nextProjects.length ? "Projects loaded." : "No projects yet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function importProject() {
    if (!sourcePath.trim()) {
      setError("Main skin path is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const project = await createProject({
        sourcePath,
        name: projectName || undefined,
      });

      setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      setProjectName("");
      setSourcePath("");
      setStatus(`Imported project: ${project.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function chooseMainSkin() {
    setLoading(true);
    setError(null);

    try {
      const selected = await chooseSkinPath();
      if (selected) setSourcePath(selected);
      setStatus(selected ? "Selected main skin path." : "File picker was cancelled or unavailable.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function rename(project: ProjectManifest) {
    const name = window.prompt("Project name", project.name);
    if (!name || name === project.name) return;

    setLoading(true);
    setError(null);

    try {
      const nextProject = await renameProject(project.id, name);
      setProjects((current) => current.map((item) => (item.id === nextProject.id ? nextProject : item)));
      setStatus("Project renamed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function remove(project: ProjectManifest) {
    if (!window.confirm(`Delete project "${project.name}"? Raw project files will be removed.`)) return;

    setLoading(true);
    setError(null);

    try {
      await deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setStatus("Project deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hub">
      <section className="hubIntro">
        <h1>osu! Skin Editor</h1>
        <p>
          Lazer-first local skin editor. Import a main skin, add asset sources,
          compare rows, preview changes, then export .osk, diff, or backup packages.
        </p>
      </section>

      <section className="hubGrid">
        <div className="panel">
          <h2>Create Project</h2>

          <label>
            Project name
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="optional"
              disabled={loading}
            />
          </label>

          <label>
            Main skin path
            <input
              value={sourcePath}
              onChange={(event) => setSourcePath(event.target.value)}
              placeholder="skins/example.osk or /absolute/skin/folder"
              disabled={loading}
            />
          </label>

          <button type="button" onClick={chooseMainSkin} disabled={loading}>
            Choose .osk or folder
          </button>

          <button
            type="button"
            className="primary"
            onClick={importProject}
            disabled={loading || !sourcePath.trim()}
          >
            Import main skin
          </button>

          <button type="button" onClick={refreshProjects} disabled={loading}>
            Refresh projects
          </button>
        </div>

        <div className="panel">
          <h2>Projects</h2>

          <div className="projectList">
            {projects.map((project) => (
              <div className="projectCard" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <p className="muted">{project.mainSourcePath}</p>
                  <p className="muted">{project.sources.length} asset sources</p>
                </div>

                <div className="inlineActions">
                  <Link className="buttonLike primary" href={`/projects/${encodeURIComponent(project.id)}`}>
                    Open
                  </Link>
                  <button type="button" onClick={() => rename(project)} disabled={loading}>
                    Rename
                  </button>
                  <button type="button" className="danger" onClick={() => remove(project)} disabled={loading}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {!projects.length && <p className="muted">No projects yet.</p>}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Project Layout</h2>
        <p className="muted">
          Each project keeps editable raw files and a generated structured mirror:
          <code> project/raw</code>, <code>project/structured</code>,
          <code> sources/*/raw</code>, and <code>sources/*/structured</code>.
          Edit raw files when using an external file manager; structured folders are regenerated from classification rules.
        </p>
      </section>

      <section className="panel">
        <h2>Status</h2>
        <p className="muted">{loading ? "Loading..." : status}</p>
        {error && <p className="warningText">{error}</p>}
      </section>
    </main>
  );
}
