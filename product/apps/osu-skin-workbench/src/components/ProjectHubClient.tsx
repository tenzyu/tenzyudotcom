"use client";


import { useEffect, useState } from "react";
import {
  chooseSkinPath,
  createProject,
  deleteProject,
  fetchProjects,
  renameProject,
} from "../lib/client/project-api";
import type { ProjectManifest } from "@tenzyu/osu-skin-core/contract";
import { Badge } from "@tenzyu/ui/badge";
import { Button } from "@tenzyu/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@tenzyu/ui/card";
import { Input } from "@tenzyu/ui/input";
import { Label } from "@tenzyu/ui/label";

type Props = {
  onOpenProject: (projectId: string) => void;
};

export function ProjectHubClient({ onOpenProject }: Props) {
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
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
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
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
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
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
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
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
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
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hubPage">
      <section className="hubHero">
        <div>
          <p className="eyebrow">
            Desktop Skin Workspace
          </p>
          <h1>Projects</h1>
          <p className="hubLead mutedText">
            Import a main skin, add asset sources, compare rows, preview changes,
            then export .osk, diff, or backup packages.
          </p>
        </div>

        <div className="hubHeaderActions">
          <Button type="button" variant="soft" onClick={refreshProjects} disabled={loading}>
            Refresh
          </Button>
        </div>
      </section>

      <section className="hubGrid">
        <Card variant="soft" className="hubCreateCard">
          <CardHeader>
            <CardTitle>Create Project</CardTitle>
            <CardDescription>Use a stable or lazer skin folder as the editable main source.</CardDescription>
          </CardHeader>

          <CardContent className="formStack">
            <div className="fieldStack">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="optional"
                disabled={loading}
              />
            </div>

            <div className="fieldStack">
              <Label htmlFor="main-skin-path">Main skin path</Label>
              <Input
                id="main-skin-path"
                value={sourcePath}
                onChange={(event) => setSourcePath(event.target.value)}
                placeholder="skins/example.osk or /absolute/skin/folder"
                disabled={loading}
              />
            </div>

            <div className="buttonRow">
              <Button type="button" variant="soft" onClick={chooseMainSkin} disabled={loading}>
                Choose .osk / folder
              </Button>
              <Button type="button" onClick={importProject} disabled={loading || !sourcePath.trim()}>
                Import main skin
              </Button>
            </div>
          </CardContent>

          <CardFooter className="statusFooter">
            {error ? (
              <div className="statusSurface statusDanger">
                {error}
              </div>
            ) : (
              <div className="statusSurface statusQuiet">
                {status}
              </div>
            )}
          </CardFooter>
        </Card>

        <div className="projectListPanel">
          <div className="sectionHeaderRow">
            <div>
              <h2>Recent projects</h2>
              <p className="mutedText">{projects.length} project(s)</p>
            </div>
          </div>

          <div className="projectList">
            {projects.map((project) => (
              <Card key={project.id} variant="interactive" className="projectCard">
                <CardHeader>
                  <div className="projectCardHeader">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.mainSourcePath}</CardDescription>
                    </div>
                    <Badge variant="secondary">{project.sources?.length ?? 0} sources</Badge>
                  </div>
                </CardHeader>

                <CardFooter className="projectCardActions">
                  <Button type="button" onClick={() => onOpenProject(project.id)} disabled={loading}>
                    Open
                  </Button>
                  <Button type="button" variant="soft" onClick={() => void rename(project)} disabled={loading}>
                    Rename
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => void remove(project)} disabled={loading}>
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {!projects.length && (
              <div className="emptyState">
                No projects yet. Import a main skin to create the first workbench project.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
