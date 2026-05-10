"use client";

import { useEffect, useMemo, useState } from "react";
import { applyAssetGroup, chooseSkinPath, createProject, deleteAssetGroup, exportProject, rebuildStructuredMirrors } from "../lib/client/project-api";
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

  const { files, matrix, fetchProjectFiles, setFiles } = useProjectFiles();
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

  async function importAsset() {
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

  const sourceFileCount = useMemo(
    () => files?.sources.reduce((count, source) => count + source.assets.length, 0) ?? 0,
    [files?.sources],
  );

  return (
    <main className={`workspaceShell${sidebarOpen ? "" : " sidebarClosed"}`}>
      {sidebarOpen && (
        <Sidebar
          projects={projectsState.projects}
          project={projectsState.project}
          projectName={projectName}
          mainPath={mainPath}
          assetName={assetName}
          assetPath={assetPath}
          scopes={navigation.scopes}
          categories={navigation.categories}
          activeScope={navigation.activeScope}
          activeCategory={navigation.activeCategory}
          loading={loading}
          status={status}
          error={error}
          onProjectName={setProjectName}
          onMainPath={setMainPath}
          onAssetName={setAssetName}
          onAssetPath={setAssetPath}
          onClose={() => setSidebarOpen(false)}
          onImportMain={() => void importMain()}
          onChooseMainPath={() => void chooseMainPath()}
          onImportAsset={() => void importAsset()}
          onChooseAssetPath={() => void chooseAssetPath()}
          onProjectSelect={(projectId) => void selectProject(projectId)}
          onRefresh={() => void refreshAll()}
          onSourceRename={(sourceId, name) => void sourceActions.renameSource(sourceId, name)}
          onSourceDelete={(sourceId) => void sourceActions.deleteSource(sourceId)}
          onScope={navigation.selectScope}
          onCategory={navigation.setActiveCategory}
        />
      )}

      <section className="workspaceMain">
        <header className="workspaceHeader">
          <div>
            {!sidebarOpen && (
              <button type="button" onClick={() => setSidebarOpen(true)}>
                Open sidebar
              </button>
            )}
            <button type="button" onClick={onBackToHub}>
              Back to projects
            </button>
            <h1>{projectsState.project?.name ?? "osu! Skin Workbench"}</h1>
            <p className="muted">
              Project files: {files?.project.length ?? 0} · Source files: {sourceFileCount} · Rows: {matrix.rows.length}
            </p>
          </div>

          <div className="workspaceActions">
            <button type="button" onClick={() => setView("edit")} className={view === "edit" ? "active" : ""}>
              Edit
            </button>
            <button type="button" onClick={() => setView("preview")} className={view === "preview" ? "active" : ""}>
              Preview
            </button>
            <button type="button" onClick={() => void rebuild()} disabled={!projectsState.project || loading}>
              Rebuild mirrors
            </button>
            <button type="button" onClick={() => void runExport("full")} disabled={!projectsState.project || loading}>
              Export full
            </button>
            <button type="button" onClick={() => void runExport("diff")} disabled={!projectsState.project || loading}>
              Export diff
            </button>
            <button type="button" onClick={() => void runExport("backup")} disabled={!projectsState.project || loading}>
              Backup
            </button>
          </div>
        </header>

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
