"use client";

import { useEffect, useState } from "react";
import {
  applyAssetGroup,
  deleteAssetGroup,
  exportProject as exportProjectApi,
  rebuildStructuredMirrors,
} from "../lib/client/project-api";
import type {
  ExportPreset,
  ExportResult,
} from "../lib/shared/project-contract";
import { useAssetMatrixNavigation } from "../hooks/useAssetMatrixNavigation";
import { useAssetSourceActions } from "../hooks/useAssetSourceActions";
import { useProjectFiles } from "../hooks/useProjectFiles";
import { useProjects } from "../hooks/useProjects";
import { EditView } from "./EditView";
import { PreviewView } from "./PreviewView";
import { Sidebar } from "./Sidebar";

type ViewMode = "edit" | "preview";

type Props = {
  initialProjectId: string;
};

export function ProjectWorkspaceClient({ initialProjectId }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  const [mainPath, setMainPath] = useState("");
  const [projectName, setProjectName] = useState("");
  const [assetPath, setAssetPath] = useState("");
  const [assetName, setAssetName] = useState("");

  const [filter, setFilter] = useState("");
  const [primaryRowsOnly, setPrimaryRowsOnly] = useState(true);
  const [exportPreset, setExportPreset] = useState<ExportPreset>("full");
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("No project loaded.");
  const [error, setError] = useState<string | null>(null);
  
  // NOTE: mounted gate
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const projectFiles = useProjectFiles();
  const matrixNavigation = useAssetMatrixNavigation(projectFiles.matrix);
  const projectsState = useProjects(initialProjectId);
  const assetSourceActions = useAssetSourceActions({
    project: projectsState.project,
    updateProject: projectsState.updateProject,
    reloadFiles: projectFiles.fetchProjectFiles,
    setStatus,
    setError,
    setLoading,
  });

  useEffect(() => {
    if (!mounted) return;
    void refreshProjects();
  }, [mounted]);

  async function refreshProjects() {
    setLoading(true);
    setError(null);

    try {
      const data = await projectsState.refreshProjects({
        loadFiles: projectFiles.fetchProjectFiles,
      });
      setStatus(data.length ? "Projects loaded." : "No projects yet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function selectProject(projectId: string, projectList = projectsState.projects) {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      await projectsState.selectProject(projectId, {
        projectList,
        loadFiles: async (nextProjectId) => {
          const data = await projectFiles.fetchProjectFiles(nextProjectId);
          setStatus(`Loaded ${data.project.length} project files.`);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function importMainSkin() {
    setError("Create new projects from the project hub.");
  }

  async function addAssetSource() {
    const nextProject = await assetSourceActions.addSource(assetPath, assetName);
    if (nextProject) {
      setAssetPath("");
      setAssetName("");
    }
  }

  async function chooseAssetSourcePath() {
    const selected = await assetSourceActions.chooseSourcePath();
    if (selected) setAssetPath(selected);
  }

  async function renameSource(sourceId: string, name: string) {
    await assetSourceActions.renameSource(sourceId, name);
  }

  async function deleteSource(sourceId: string) {
    await assetSourceActions.deleteSource(sourceId);
  }

  async function exportCurrentProject() {
    if (!projectsState.project) return;

    setLoading(true);
    setError(null);
    setExportResult(null);

    try {
      const result = await exportProjectApi({ projectId: projectsState.project.id, preset: exportPreset });
      setExportResult(result);
      setStatus(`Exported ${result.fileCount} files to ${result.outputPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function rebuildStructured() {
    if (!projectsState.project) return;

    setLoading(true);
    setError(null);

    try {
      const result = await rebuildStructuredMirrors(projectsState.project.id);
      await projectFiles.fetchProjectFiles(projectsState.project.id);
      setStatus(
        `Rebuilt structured mirrors: ${result.projectFileCount} project files, ${Object.keys(result.sourceFileCounts).length} sources.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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
        ...input,
      });
      const files = await projectFiles.fetchProjectFiles(projectsState.project.id);
      setStatus(`Copied ${result.copiedCount} files. Project now has ${files.project.length} files.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteProjectRow(projectPaths: string[]) {
    if (!projectsState.project) return;
    if (!projectPaths.length) return;

    setLoading(true);
    setError(null);

    try {
      const result = await deleteAssetGroup({
        projectId: projectsState.project.id,
        projectPaths,
      });
      const files = await projectFiles.fetchProjectFiles(projectsState.project.id);
      setStatus(`Deleted ${result.deletedCount} files. Project now has ${files.project.length} files.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return <InitialShell />;
  }
  
  return (
    <main className={`app${sidebarOpen ? "" : " sidebarCollapsed"}`}>
      {sidebarOpen ? (
        <Sidebar
        projects={projectsState.projects}
        project={projectsState.project}
        projectName={projectName}
        mainPath={mainPath}
        assetName={assetName}
        assetPath={assetPath}
        scopes={matrixNavigation.scopes}
        categories={matrixNavigation.categories}
        activeScope={matrixNavigation.activeScope}
        activeCategory={matrixNavigation.activeCategory}
        loading={loading}
        status={status}
        error={error}
        onProjectName={setProjectName}
        onMainPath={setMainPath}
        onAssetName={setAssetName}
        onAssetPath={setAssetPath}
        onClose={() => setSidebarOpen(false)}
        onImportMain={importMainSkin}
        onImportAsset={addAssetSource}
        onChooseAssetPath={chooseAssetSourcePath}
        onProjectSelect={selectProject}
        onRefresh={refreshProjects}
        onSourceRename={renameSource}
        onSourceDelete={deleteSource}
        onScope={matrixNavigation.selectScope}
        onCategory={matrixNavigation.setActiveCategory}
      />
      ) : (
        <button
          type="button"
          className="sidebarToggle"
          onClick={() => setSidebarOpen(true)}
        >
          Open sidebar
        </button>
      )}

      <section className="main">
        <header className="toolbar">
          <div>
            <h2>{projectsState.project?.name ?? "osu! Skin Editor"}</h2>
            <p>
              {projectFiles.files
                ? `${projectFiles.files.project.length} project files · ${projectFiles.files.sources.length} asset sources`
                : "Lazer-first skin editor. Import a skin to start."}
            </p>
          </div>

          <div className="toolbarActions">
            <div className="viewSwitch">
              <button
                type="button"
                className={viewMode === "edit" ? "active" : ""}
                onClick={() => setViewMode("edit")}
              >
                Edit
              </button>
              <button
                type="button"
                className={viewMode === "preview" ? "active" : ""}
                onClick={() => setViewMode("preview")}
              >
                Preview
              </button>
            </div>
            <button type="button" onClick={refreshProjects} disabled={loading}>
              Refresh
            </button>
            <button type="button" onClick={rebuildStructured} disabled={loading || !projectsState.project}>
              Rebuild structured
            </button>
            <select
              value={exportPreset}
              onChange={(event) => setExportPreset(event.target.value as ExportPreset)}
              disabled={loading || !projectsState.project}
              title="Export preset"
            >
              <option value="full">Full .osk</option>
              <option value="sd-only">SD only</option>
              <option value="hd-only">HD only</option>
              <option value="diff">Diff</option>
              <option value="backup">Backup</option>
            </select>
            <button type="button" onClick={exportCurrentProject} disabled={loading || !projectsState.project}>
              Export
            </button>
          </div>
        </header>

        {exportResult && (
          <div className="statusBanner">
            <strong>{exportResult.preset}</strong> exported {exportResult.fileCount} files
            to {exportResult.outputPath}. {exportResult.notes.join(" ")}
          </div>
        )}

        <nav className="tabs">
          {matrixNavigation.scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              className={`tab${scope.id === matrixNavigation.activeScope ? " active" : ""}`}
              onClick={() => matrixNavigation.selectScope(scope.id)}
            >
              {scope.label} {scope.count}
            </button>
          ))}
        </nav>

        <nav className="tabs subTabs">
          {matrixNavigation.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`tab${category.id === matrixNavigation.activeCategory ? " active" : ""}`}
              onClick={() => matrixNavigation.setActiveCategory(category.id)}
            >
              {category.label} {category.count}
            </button>
          ))}
        </nav>

        {viewMode === "edit" ? (
          <EditView
            projectId={projectsState.project?.id ?? null}
            matrix={projectFiles.matrix}
            selectedSourceId={matrixNavigation.selectedSourceId}
            scope={matrixNavigation.activeScope}
            category={matrixNavigation.activeCategory}
            filter={filter}
            meaningfulOnly={primaryRowsOnly}
            collapseStable={primaryRowsOnly}
            onFilter={setFilter}
            onSelectedSourceId={matrixNavigation.setSelectedSourceId}
            onMeaningfulOnly={setPrimaryRowsOnly}
            onCollapseStable={setPrimaryRowsOnly}
            onCopySourceRow={copySourceRow}
            onDeleteProjectRow={deleteProjectRow}
          />
        ) : (
          <PreviewView
            matrix={projectFiles.matrix}
            scope={matrixNavigation.activeScope}
            category={matrixNavigation.activeCategory}
          />
        )}
      </section>
    </main>
  );
}

function InitialShell() {
  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandHeader">
            <h1>osu! Skin Editor</h1>
          </div>
          <p>Lazer-first, Stable later.</p>
        </div>

        <section>
          <h2>Loading</h2>
          <p className="muted">Preparing local editor...</p>
        </section>
      </aside>

      <section className="main">
        <header className="toolbar">
          <div>
            <h2>osu! Skin Editor</h2>
            <p>Loading Next.js editor shell...</p>
          </div>
        </header>

        <section className="compareShell">
          <div className="emptyState">Loading editor...</div>
        </section>
      </section>
    </main>
  );
}
