"use client";

import {
  Button,
} from "@tenzyu/ui";

import { useEffect, useMemo, useState } from "react";
import {
  applyAssetGroup,
  chooseSkinPath,
  createProject,
  deleteAssetGroup,
  exportProject,
  rebuildStructuredMirrors,
} from "../lib/client/project-api";
import type { ExportPreset } from "@tenzyu/osu-skin-core/lib/shared/project-contract";
import { useAssetMatrixNavigation } from "../hooks/useAssetMatrixNavigation";
import { useAssetSourceActions } from "../hooks/useAssetSourceActions";
import { useProjectFiles } from "../hooks/useProjectFiles";
import { useProjects } from "../hooks/useProjects";
import { EditView } from "./EditView";
import { PreviewView } from "./PreviewView";
import { Sidebar } from "./Sidebar";

type Props = {
  initialProjectId: string;
  onBackToHub: () => void;
};

export function ProjectWorkspaceClient({ initialProjectId, onBackToHub }: Props) {
  const [projectName, setProjectName] = useState("");
  const [mainPath, setMainPath] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetPath, setAssetPath] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState("");
  const [meaningfulOnly, setMeaningfulOnly] = useState(true);
  const [collapseStable, setCollapseStable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Loading project.");
  const [error, setError] = useState<string | null>(null);

  const { files, matrix, fetchProjectFiles } = useProjectFiles();
  const projectsState = useProjects(initialProjectId);
  const navigation = useAssetMatrixNavigation(matrix);

  const sourceActions = useAssetSourceActions({
    project: projectsState.project,
    updateProject: projectsState.updateProject,
    reloadFiles: fetchProjectFiles,
    setStatus,
    setError,
    setLoading,
  });

  const sourceFileCount = useMemo(() => countSourceFiles(files), [files]);

  useEffect(() => {
    void refreshAll();
    // initialProjectId is intentionally captured by useProjects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    setLoading(true);
    setError(null);

    try {
      const projects = await projectsState.refreshProjects({ loadFiles: fetchProjectFiles });
      setStatus(projects.length ? "Projects loaded." : "No projects yet.");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  async function importMain() {
    if (!mainPath.trim()) {
      setError("Main skin path is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const project = await createProject({ sourcePath: mainPath, name: projectName || undefined });
      projectsState.setProject(project);
      projectsState.setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      await fetchProjectFiles(project.id);
      setProjectName("");
      setMainPath("");
      setStatus(`Imported project: ${project.name}`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  async function chooseMainPath() {
    setLoading(true);
    setError(null);

    try {
      const selected = await chooseSkinPath();
      if (selected) setMainPath(selected);
      setStatus(selected ? "Selected main skin path." : "File picker was cancelled.");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  async function chooseAssetPath() {
    const selected = await sourceActions.chooseSourcePath();
    if (selected) setAssetPath(selected);
  }

  async function addSource() {
    const nextProject = await sourceActions.addSource(assetPath, assetName || undefined);
    if (nextProject) {
      setAssetName("");
      setAssetPath("");
    }
  }

  async function selectProject(projectId: string) {
    await projectsState.selectProject(projectId, { loadFiles: fetchProjectFiles });
  }

  async function copySourceRow(input: {
    sourceId: string;
    sourcePaths: string[];
    replaceProjectPaths: string[];
  }) {
    if (!projectsState.project) return;
    setLoading(true);
    setError(null);

    try {
      const result = await applyAssetGroup({
        projectId: projectsState.project.id,
        sourceId: input.sourceId,
        sourcePaths: input.sourcePaths,
        replaceProjectPaths: input.replaceProjectPaths,
      });
      await fetchProjectFiles(projectsState.project.id);
      setStatus(`Copied ${result.copiedCount} file(s), deleted ${result.deletedCount}, rebuilt ${result.rebuiltStructuredCount}.`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  async function deleteProjectRow(projectPaths: string[]) {
    if (!projectsState.project || !projectPaths.length) return;
    if (!window.confirm(`Delete ${projectPaths.length} project file(s)?`)) return;

    setLoading(true);
    setError(null);

    try {
      const result = await deleteAssetGroup({ projectId: projectsState.project.id, projectPaths });
      await fetchProjectFiles(projectsState.project.id);
      setStatus(`Deleted ${result.deletedCount} file(s), rebuilt ${result.rebuiltStructuredCount}.`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  async function rebuild() {
    if (!projectsState.project) return;
    setLoading(true);
    setError(null);

    try {
      const result = await rebuildStructuredMirrors(projectsState.project.id);
      await fetchProjectFiles(projectsState.project.id);
      setStatus(`Rebuilt project mirror (${result.projectFileCount} files).`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  async function runExport(preset: ExportPreset) {
    if (!projectsState.project) return;
    setLoading(true);
    setError(null);

    try {
      const result = await exportProject({ projectId: projectsState.project.id, preset });
      setStatus(`Exported ${result.fileCount} file(s) to ${result.outputPath}.`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`workspaceShell${sidebarOpen ? "" : " sidebarClosed"}`}>
      {sidebarOpen && (
        <Sidebar
          project={projectsState.project}
          projects={projectsState.projects}
          projectName={projectName}
          mainPath={mainPath}
          assetName={assetName}
          assetPath={assetPath}
          loading={loading}
          status={status}
          error={error}
          matrix={matrix}
          activeScope={navigation.activeScope}
          activeCategory={navigation.activeCategory}
          onProjectName={setProjectName}
          onMainPath={setMainPath}
          onChooseMainPath={() => void chooseMainPath()}
          onImportMain={() => void importMain()}
          onAssetName={setAssetName}
          onAssetPath={setAssetPath}
          onChooseAssetPath={() => void chooseAssetPath()}
          onImportAsset={() => void addSource()}
          onProjectSelect={(projectId) => void selectProject(projectId)}
          onSourceRename={(sourceId, name) => void sourceActions.renameSource(sourceId, name)}
          onSourceDelete={(sourceId) => void sourceActions.deleteSource(sourceId)}
          onScope={navigation.selectScope}
          onCategory={navigation.setActiveCategory}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      <section className="workspaceMain">
        <header className="workspaceHeader">
          <div className="workspaceTitleBlock">
            <div className="inlineActions">
              {!sidebarOpen && (
                <Button type="button" variant="soft" size="sm" onClick={() => setSidebarOpen(true)}>
                  Open sidebar
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={onBackToHub}>
                Back to projects
              </Button>
            </div>
            <h1>{projectsState.project?.name ?? "osu! Skin Workbench"}</h1>
            <p className="workspaceMeta mutedText">
              Project files: {files?.project.length ?? 0} · Source files: {sourceFileCount} · Rows: {matrix.rows.length}
            </p>
          </div>

          <div className="workspaceActions">
            <Button type="button" size="sm" variant={view === "edit" ? "default" : "soft"} onClick={() => setView("edit")}>
              Edit
            </Button>
            <Button type="button" size="sm" variant={view === "preview" ? "default" : "soft"} onClick={() => setView("preview")}>
              Preview
            </Button>
            <Button type="button" size="sm" variant="soft" onClick={() => void rebuild()} disabled={!projectsState.project || loading}>
              Rebuild mirrors
            </Button>
            <Button type="button" size="sm" variant="soft" onClick={() => void runExport("full")} disabled={!projectsState.project || loading}>
              Export full
            </Button>
            <Button type="button" size="sm" variant="soft" onClick={() => void runExport("diff")} disabled={!projectsState.project || loading}>
              Export diff
            </Button>
            <Button type="button" size="sm" variant="soft" onClick={() => void runExport("backup")} disabled={!projectsState.project || loading}>
              Backup
            </Button>
          </div>
        </header>

        {(error || status) && (
          <div className={`workspaceStatus ${error ? "statusDanger" : "statusQuiet"}`}>
            {error ?? status}
          </div>
        )}

        {view === "edit" ? (
          <EditView
            projectId={projectsState.project?.id ?? null}
            matrix={matrix}
            selectedSourceId={navigation.selectedSourceId}
            scope={navigation.activeScope}
            category={navigation.activeCategory}
            filter={filter}
            meaningfulOnly={meaningfulOnly}
            collapseStable={collapseStable}
            onSelectedSourceId={navigation.setSelectedSourceId}
            onFilter={setFilter}
            onMeaningfulOnly={setMeaningfulOnly}
            onCollapseStable={setCollapseStable}
            onCopySourceRow={copySourceRow}
            onDeleteProjectRow={(paths) => void deleteProjectRow(paths)}
          />
        ) : (
          <PreviewView matrix={matrix} scope={navigation.activeScope} category={navigation.activeCategory} />
        )}
      </section>
    </main>
  );
}

function countSourceFiles(files: unknown): number {
  const sourceFiles = (files as { sources?: unknown })?.sources;

  if (Array.isArray(sourceFiles)) {
    return sourceFiles.reduce((sum, entry) => {
      if (Array.isArray(entry)) return sum + entry.length;
      if (entry && typeof entry === "object" && Array.isArray((entry as { files?: unknown[] }).files)) {
        return sum + ((entry as { files: unknown[] }).files.length ?? 0);
      }
      return sum;
    }, 0);
  }

  if (sourceFiles && typeof sourceFiles === "object") {
    return Object.values(sourceFiles as Record<string, unknown>).reduce((sum, entry) => {
      if (Array.isArray(entry)) return sum + entry.length;
      if (entry && typeof entry === "object" && Array.isArray((entry as { files?: unknown[] }).files)) {
        return sum + ((entry as { files: unknown[] }).files.length ?? 0);
      }
      return sum;
    }, 0);
  }

  return 0;
}
