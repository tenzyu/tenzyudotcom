import { useEffect, useMemo, useState } from "react";
import type { ExportResult, HistoryEntrySummary, MatrixRow, ProjectFilesResponse, ProjectManifest, ValidationWarning } from "../../shared/editor-types";
import { editorApi } from "./api";
import { EditView } from "./components/EditView";
import { Sidebar } from "./components/Sidebar";
import { PreviewView } from "./components/PreviewView";
import { ConflictModal, ExportModal, HistoryModal, ReclassifyModal, TextModal, WarningModal } from "./components/Modals";
import type { PreviewTab } from "./preview/draw";

type ViewMode = "edit" | "preview";

export function App() {
  const [workspaceRoot, setWorkspaceRoot] = useState("");
  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [project, setProject] = useState<ProjectManifest | null>(null);
  const [files, setFiles] = useState<ProjectFilesResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntrySummary[]>([]);
  const [view, setView] = useState<ViewMode>((localStorage.getItem("viewMode") as ViewMode) || "edit");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("song-select");
  const [scope, setScope] = useState("std");
  const [category, setCategory] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [meaningfulOnly, setMeaningfulOnly] = useState(true);
  const [collapseStable, setCollapseStable] = useState(true);
  const [sourceFilterMode, setSourceFilterMode] = useState("all");
  const [density, setDensity] = useState(localStorage.getItem("densityMode") || "comfortable");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mainPath, setMainPath] = useState("");
  const [assetPath, setAssetPath] = useState("");
  const [projectName, setProjectName] = useState("");
  const [assetName, setAssetName] = useState("");
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("recentAssetSources") || "[]") as string[]);
  const [disabledSources, setDisabledSources] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem("disabledSourceIds") || "[]") as string[]));
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [modal, setModal] = useState<"warnings" | "history" | "conflicts" | "export" | null>(null);
  const [textEdit, setTextEdit] = useState<{ path: string; content: string } | null>(null);
  const [reclassifyPreview, setReclassifyPreview] = useState<Awaited<ReturnType<typeof editorApi.reclassifyPreview>> | null>(null);
  const [exportPreset, setExportPreset] = useState("full");
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!files) return;
    const scopes = files.scopes;
    const nextScope = scopes.includes(scope as never) ? scope : firstScope(files);
    const categories = categoriesFor(files, nextScope);
    const nextCategory = categories.includes(category) ? category : categories[0] || "";
    const activeSources = files.sources.filter((source) => !disabledSources.has(source.id));
    const nextSource = activeSources.some((source) => source.id === sourceId) ? sourceId : activeSources[0]?.id || files.sources[0]?.id || "";
    if (nextScope !== scope) setScope(nextScope);
    if (nextCategory !== category) setCategory(nextCategory);
    if (nextSource !== sourceId) setSourceId(nextSource);
  }, [files, scope, category, sourceId, disabledSources]);

  async function boot() {
    try {
      const health = await editorApi.health();
      setWorkspaceRoot(health.workspaceRoot);
      await loadProjects();
    } catch (error) {
      notify(error);
    }
  }

  async function loadProjects() {
    const nextProjects = await editorApi.projects();
    setProjects(nextProjects);
    if (!project && nextProjects[0]) await loadProject(nextProjects[0].id);
  }

  async function loadProject(projectId: string) {
    const [nextProject, nextFiles, nextHistory] = await Promise.all([
      editorApi.project(projectId),
      editorApi.files(projectId),
      editorApi.history(projectId),
    ]);
    setProject(nextProject);
    setFiles(nextFiles);
    setHistory(nextHistory);
    setSelectedRows(new Set());
  }

  function notify(error: unknown, isError = true) {
    setToast({ message: error instanceof Error ? error.message : String(error), error: isError });
  }

  async function choose(target: "main" | "asset", kind: "file" | "directory") {
    try {
      const result = await editorApi.chooseSkin(kind);
      if (!result.path) return;
      if (target === "main") setMainPath(result.path);
      else setAssetPath(result.path);
    } catch {
      notify("File dialog failed. Manual path still works.");
    }
  }

  async function importMain() {
    try {
      const next = await editorApi.importMain(mainPath, projectName);
      setToast({ message: "Main skin imported." });
      await loadProjects();
      await loadProject(next.id);
    } catch (error) {
      notify(error);
    }
  }

  async function importAsset(sourcePath = assetPath, name = assetName) {
    if (!project) return notify("Import a main skin first.");
    try {
      await editorApi.importAssets(project.id, sourcePath, name);
      const nextRecent = [sourcePath, ...recent.filter((entry) => entry !== sourcePath)].slice(0, 5);
      setRecent(nextRecent);
      localStorage.setItem("recentAssetSources", JSON.stringify(nextRecent));
      setToast({ message: "Asset source imported." });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  const selectedRowObjects = useMemo(() => {
    if (!files) return [];
    return files.matrix.rows.filter((row) => selectedRows.has(row.rowKey) && row.cells[sourceId]?.files.length);
  }, [files, selectedRows, sourceId]);

  async function copySelected() {
    if (!project) return;
    if (!selectedRowObjects.length) return notify("Select asset rows first.");
    setModal("conflicts");
  }

  async function applySelected() {
    if (!project) return;
    try {
      await editorApi.mix(project.id, selectedRowObjects.map((row) => ({
        sourceId,
        paths: row.cells[sourceId].files.map((file) => file.path),
        action: "replace",
      })));
      setModal(null);
      setToast({ message: "Assets copied." });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  async function deleteGroup(row: MatrixRow) {
    if (!project) return;
    try {
      for (const file of row.cells.project.files) await editorApi.deleteFile(project.id, file.path);
      setToast({ message: "Project files deleted." });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  async function restoreMain(row: MatrixRow) {
    if (!project || !row.cells.main) return;
    try {
      await editorApi.restore(project.id, "main", row.cells.main.files.map((file) => file.path));
      setToast({ message: "Restored from main." });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  async function openText(path: string) {
    if (!project) return;
    try {
      setTextEdit({ path, content: await editorApi.readText(project.id, path) });
    } catch (error) {
      notify(error);
    }
  }

  async function saveText() {
    if (!project || !textEdit) return;
    try {
      await editorApi.writeText(project.id, textEdit.path, textEdit.content);
      setTextEdit(null);
      setToast({ message: "Saved." });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  function jumpWarning(warning: ValidationWarning) {
    if (!files) return;
    const row = files.matrix.rows.find((candidate) => candidate.rowKey === warning.rowKey);
    setModal(null);
    if (row) {
      setView("edit");
      setScope(row.scope);
      setCategory(row.category);
      window.requestAnimationFrame(() => document.querySelector(`[data-row-key="${CSS.escape(row.rowKey)}"]`)?.scrollIntoView({ block: "center" }));
      return;
    }
    setView("preview");
    setPreviewTab(warning.scope === "configs" ? "song-select" : (warning.scope as PreviewTab));
  }

  async function ignoreWarning(warning: ValidationWarning) {
    if (!project) return;
    try {
      await editorApi.warningState(project.id, warning.id, !warning.ignored);
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  async function undo() {
    if (!project) return;
    try {
      const result = await editorApi.undo(project.id);
      setToast({ message: `Undone: ${result.undone}` });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  async function openReclassify() {
    if (!project) return;
    try {
      setReclassifyPreview(await editorApi.reclassifyPreview(project.id));
    } catch (error) {
      notify(error);
    }
  }

  async function applyReclassify() {
    if (!project) return;
    try {
      await editorApi.reclassify(project.id);
      setReclassifyPreview(null);
      setToast({ message: "Project reclassified." });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  async function runExport() {
    if (!project) return;
    const resolution = exportPreset === "sd" ? "sd" : exportPreset === "hd" ? "hd" : "full";
    const formats = exportPreset === "backup" ? ["backup"] : exportPreset === "diff" ? ["diff"] : ["flat", "osk"];
    try {
      const result = await editorApi.exportProject(project.id, { preset: exportPreset, formats, resolution, includeStable: true, includeExtras: true });
      setExportResult(result);
      setToast({ message: `Exported ${Object.values(result.counts).reduce((sum, count) => sum + count, 0)} files.` });
      await loadProject(project.id);
    } catch (error) {
      notify(error);
    }
  }

  const latestHistory = history[0];
  const appClass = sidebarCollapsed ? "app sidebarCollapsed" : "app";

  return (
    <div className={appClass}>
      <Sidebar
        workspaceRoot={workspaceRoot}
        projects={projects}
        project={project}
        sources={files?.sources || []}
        recent={recent}
        mainPath={mainPath}
        assetPath={assetPath}
        projectName={projectName}
        assetName={assetName}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(true)}
        onChoose={choose}
        onImportMain={importMain}
        onImportBackup={async () => {
          try {
            const next = await editorApi.importBackup(mainPath);
            setToast({ message: "Backup imported as a new project." });
            await loadProjects();
            await loadProject(next.id);
          } catch (error) {
            notify(error);
          }
        }}
        onProjectName={setProjectName}
        onMainPath={setMainPath}
        onAssetName={setAssetName}
        onAssetPath={setAssetPath}
        onProjectSelect={loadProject}
        onRefresh={loadProjects}
        onImportAsset={() => void importAsset()}
        onDeleteSource={async (id) => {
          if (!project) return;
          await editorApi.deleteSource(project.id, id);
          await loadProject(project.id);
        }}
        onReimportRecent={(path) => void importAsset(path, "")}
        disabledSources={disabledSources}
        onToggleSource={(id) => {
          const next = new Set(disabledSources);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setDisabledSources(next);
          localStorage.setItem("disabledSourceIds", JSON.stringify([...next]));
        }}
      />

      <main className="main">
        <header className="toolbar">
          {sidebarCollapsed && <button className="sidebarOpen" onClick={() => setSidebarCollapsed(false)}>☰</button>}
          <div><h2>{project?.name || "No project loaded"}</h2><p>{project && files ? `${project.id} · ${files.project.length} files · ${files.sources.length} asset sources · ${files.validation.count} warnings` : "Import a main skin to start."}</p></div>
          <div className="toolbarActions">
            <div className="viewSwitch">
              <button className={view === "edit" ? "active" : ""} onClick={() => { setView("edit"); localStorage.setItem("viewMode", "edit"); }}>Edit</button>
              <button className={view === "preview" ? "active" : ""} onClick={() => { setView("preview"); localStorage.setItem("viewMode", "preview"); }}>Preview</button>
            </div>
            <button disabled={!latestHistory} onClick={undo}>{latestHistory ? `Undo: ${latestHistory.action} ${latestHistory.affectedCount} files` : "Undo"}</button>
            <button onClick={() => setModal("history")}>History</button>
            <button onClick={openReclassify}>Reclassify</button>
            <button className="primary" onClick={() => { setExportResult(null); setModal("export"); }}>Export</button>
          </div>
        </header>

        {files && view === "edit" && (
          <EditView
            files={files}
            scope={scope}
            category={category}
            sourceId={sourceId}
            selectedRows={selectedRows}
            filter={filter}
            meaningfulOnly={meaningfulOnly}
            collapseStable={collapseStable}
            sourceFilterMode={sourceFilterMode}
            density={density}
            onScope={(value) => { setScope(value); setCategory(categoriesFor(files, value)[0] || ""); setSelectedRows(new Set()); }}
            onCategory={(value) => { setCategory(value); setSelectedRows(new Set()); }}
            onSource={(value) => { setSourceId(value); setSelectedRows(new Set()); }}
            onFilter={setFilter}
            onMeaningfulOnly={setMeaningfulOnly}
            onCollapseStable={setCollapseStable}
            onSourceFilterMode={setSourceFilterMode}
            onDensity={(value) => { setDensity(value); localStorage.setItem("densityMode", value); }}
            onToggleRow={(rowKey) => setSelectedRows((current) => {
              const next = new Set(current);
              if (next.has(rowKey)) next.delete(rowKey);
              else next.add(rowKey);
              return next;
            })}
            onSelectRows={(rows) => setSelectedRows((current) => new Set([...current, ...rows.map((row) => row.rowKey)]))}
            onClearRows={(rows) => {
              if (!rows) return setSelectedRows(new Set());
              setSelectedRows((current) => {
                const next = new Set(current);
                for (const row of rows) next.delete(row.rowKey);
                return next;
              });
            }}
            onCopySelected={copySelected}
            onDeleteGroup={deleteGroup}
            onRestoreMain={restoreMain}
            onEditText={openText}
            onOpenWarnings={() => setModal("warnings")}
            onJumpWarning={jumpWarning}
          />
        )}

        {files && view === "preview" && <PreviewView files={files} tab={previewTab} onTab={setPreviewTab} />}
      </main>

      {files && modal === "warnings" && <WarningModal warnings={files.validation.warnings} onClose={() => setModal(null)} onJump={jumpWarning} onIgnore={ignoreWarning} />}
      {modal === "history" && <HistoryModal history={history} onClose={() => setModal(null)} />}
      {modal === "conflicts" && files && <ConflictModal rows={selectedRowObjects} sourceId={sourceId} onClose={() => setModal(null)} onApply={applySelected} />}
      {files && modal === "export" && <ExportModal warnings={files.validation.warnings} result={exportResult} preset={exportPreset} onPreset={setExportPreset} onClose={() => setModal(null)} onRun={runExport} />}
      {textEdit && <TextModal path={textEdit.path} content={textEdit.content} onContent={(content) => setTextEdit({ ...textEdit, content })} onClose={() => setTextEdit(null)} onSave={saveText} />}
      {reclassifyPreview && <ReclassifyModal preview={reclassifyPreview} onClose={() => setReclassifyPreview(null)} onApply={applyReclassify} />}
      {toast && <div className={`toast${toast.error ? " error" : ""}`}>{toast.message}</div>}
    </div>
  );
}

function firstScope(files: ProjectFilesResponse) {
  return files.scopes.find((scope) => files.matrix.rows.some((row) => row.scope === scope)) || files.scopes[0] || "std";
}

function categoriesFor(files: ProjectFilesResponse, scope: string) {
  return [...new Set(files.matrix.rows.filter((row) => row.scope === scope).map((row) => row.category))].sort();
}
