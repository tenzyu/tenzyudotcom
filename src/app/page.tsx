/**
 * TODO:
 * - projectId 別の page に切り分ける REF: https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes
 * - root ページの操作はプロジェクトの作成・削除・選択・更新に留める
 * - root ページにはそれとは別にこのツールの紹介セクションを設ける
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { classificationRules } from "../lib/classification/classification-rules";
import type { ClassifiedSkinAsset } from "../lib/domain/skin-asset";
import {
  buildAssetMatrix,
  type AssetMatrix,
  type AssetMatrixRowSeed,
} from "../lib/project/asset-matrix-builder";
import { EditView } from "../components/EditView";
import { PreviewView } from "../components/PreviewView";
import { Sidebar } from "../components/Sidebar";

type ViewMode = "edit" | "preview";

type SourceManifest = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
};

type ProjectManifest = {
  id: string;
  name: string;
  mainSourcePath: string;
  createdAt: string;
  updatedAt: string;
  sources: SourceManifest[];
};

type ProjectFilesResponse = {
  project: ClassifiedSkinAsset[];
  projectTree: unknown;
  sources: Array<SourceManifest & { assets: ClassifiedSkinAsset[]; tree: unknown }>;
  matrix: AssetMatrix;
};

type ApiError = {
  error: string;
};

function rowSeedsFromRules(): AssetMatrixRowSeed[] {
  return classificationRules.map((rule) => ({
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
    taxonomyPath: rule.path,
    groupKey: rule.path.groupId,
    kind: rule.kind,
    meaning: rule.meaning,
  }));
}

function createEmptyMatrix(): AssetMatrix {
  return buildAssetMatrix({
    project: [],
    sources: [],
    rowSeeds: rowSeedsFromRules(),
  });
}


function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

async function readJson<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message = isApiError(json) ? json.error : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return json as T;
}

export default function Page() {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  const [projects, setProjects] = useState<ProjectManifest[]>([]);
  const [project, setProject] = useState<ProjectManifest | null>(null);
  const [files, setFiles] = useState<ProjectFilesResponse | null>(null);

  const [mainPath, setMainPath] = useState("");
  const [projectName, setProjectName] = useState("");
  const [assetPath, setAssetPath] = useState("");
  const [assetName, setAssetName] = useState("");

  const [activeScope, setActiveScope] = useState("std");
  const [activeCategory, setActiveCategory] = useState("hit-circles");
  const [filter, setFilter] = useState("");
  const [meaningfulOnly, setMeaningfulOnly] = useState(true);
  const [collapseStable, setCollapseStable] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("No project loaded.");
  const [error, setError] = useState<string | null>(null);
  
  // NOTE: mounted gate
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const matrix = files?.matrix ?? createEmptyMatrix();

  const scopes = useMemo(() => {
    const byScope = new Map<string, { id: string; label: string; count: number }>();

    for (const row of matrix.rows) {
      const current = byScope.get(row.scope) ?? {
        id: row.scope,
        label: row.taxonomy.scope.label,
        count: 0,
      };

      current.count += 1;
      byScope.set(row.scope, current);
    }

    return [...byScope.values()];
  }, [matrix.rows]);

  const categories = useMemo(() => {
    const byCategory = new Map<string, { id: string; label: string; count: number }>();

    for (const row of matrix.rows) {
      if (row.scope !== activeScope) continue;

      const current = byCategory.get(row.category) ?? {
        id: row.category,
        label: row.taxonomy.category.label,
        count: 0,
      };

      current.count += 1;
      byCategory.set(row.category, current);
    }

    return [...byCategory.values()];
  }, [activeScope, matrix.rows]);

  useEffect(() => {
    if (!mounted) return;
    void refreshProjects();
  }, [mounted]);

  useEffect(() => {
    const hasActiveScope = matrix.rows.some((row) => row.scope === activeScope);
    const nextScope = hasActiveScope ? activeScope : matrix.rows[0]?.scope;

    if (!nextScope) return;

    const hasActiveCategory = matrix.rows.some(
      (row) => row.scope === nextScope && row.category === activeCategory,
    );

    const nextCategory = hasActiveCategory
      ? activeCategory
      : matrix.rows.find((row) => row.scope === nextScope)?.category;

    if (nextScope !== activeScope) setActiveScope(nextScope);
    if (nextCategory && nextCategory !== activeCategory) setActiveCategory(nextCategory);
  }, [activeCategory, activeScope, matrix.rows]);

  async function refreshProjects() {
    setLoading(true);
    setError(null);

    try {
      const data = await readJson<{ projects: ProjectManifest[] }>(await fetch("/api/projects"));
      setProjects(data.projects);

      if (!project && data.projects[0]) {
        await selectProject(data.projects[0].id, data.projects);
      } else {
        setStatus(data.projects.length ? "Projects loaded." : "No projects yet.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjectFiles(projectId: string) {
    const data = await readJson<ProjectFilesResponse>(
      await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`),
    );

    setFiles(data);
    setStatus(`Loaded ${data.project.length} project files.`);
  }

  async function selectProject(projectId: string, projectList = projects) {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const selected = projectList.find((item) => item.id === projectId) ?? null;
      setProject(selected);
      await fetchProjectFiles(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function importMainSkin() {
    if (!mainPath.trim()) {
      setError("Main skin path is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await readJson<{ project: ProjectManifest }>(
        await fetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sourcePath: mainPath,
            name: projectName || undefined,
          }),
        }),
      );

      setProject(data.project);
      setProjectName("");
      setMainPath("");

      const nextProjects = [data.project, ...projects.filter((item) => item.id !== data.project.id)];
      setProjects(nextProjects);

      await fetchProjectFiles(data.project.id);
      setStatus(`Imported project: ${data.project.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function addAssetSource() {
    if (!project) {
      setError("Select or import a project first.");
      return;
    }

    if (!assetPath.trim()) {
      setError("Asset source path is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await readJson<{ project: ProjectManifest }>(
        await fetch(`/api/projects/${encodeURIComponent(project.id)}/sources`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sourcePath: assetPath,
            name: assetName || undefined,
          }),
        }),
      );

      setProject(data.project);
      setProjects((current) => current.map((item) => (item.id === data.project.id ? data.project : item)));

      setAssetPath("");
      setAssetName("");

      await fetchProjectFiles(data.project.id);
      setStatus(`Added source to ${data.project.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function selectScope(scopeId: string) {
    setActiveScope(scopeId);

    const firstCategory = matrix.rows.find((row) => row.scope === scopeId)?.category;
    setActiveCategory(firstCategory ?? "");
  }

  if (!mounted) {
    return <InitialShell />;
  }
  
  return (
    <main className="app">
      <Sidebar
        projects={projects}
        project={project}
        projectName={projectName}
        mainPath={mainPath}
        assetName={assetName}
        assetPath={assetPath}
        scopes={scopes}
        categories={categories}
        activeScope={activeScope}
        activeCategory={activeCategory}
        loading={loading}
        status={status}
        error={error}
        onProjectName={setProjectName}
        onMainPath={setMainPath}
        onAssetName={setAssetName}
        onAssetPath={setAssetPath}
        onImportMain={importMainSkin}
        onImportAsset={addAssetSource}
        onProjectSelect={selectProject}
        onRefresh={refreshProjects}
        onScope={selectScope}
        onCategory={setActiveCategory}
      />

      <section className="main">
        <header className="toolbar">
          <div>
            <h2>{project?.name ?? "osu! Skin Editor"}</h2>
            <p>
              {files
                ? `${files.project.length} project files · ${files.sources.length} asset sources`
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
            <button type="button" disabled>
              Export
            </button>
          </div>
        </header>

        <nav className="tabs">
          {scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              className={`tab${scope.id === activeScope ? " active" : ""}`}
              onClick={() => selectScope(scope.id)}
            >
              {scope.label} {scope.count}
            </button>
          ))}
        </nav>

        <nav className="tabs subTabs">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`tab${category.id === activeCategory ? " active" : ""}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label} {category.count}
            </button>
          ))}
        </nav>

        {viewMode === "edit" ? (
          <EditView
            matrix={matrix}
            scope={activeScope}
            category={activeCategory}
            filter={filter}
            meaningfulOnly={meaningfulOnly}
            collapseStable={collapseStable}
            onFilter={setFilter}
            onMeaningfulOnly={setMeaningfulOnly}
            onCollapseStable={setCollapseStable}
          />
        ) : (
          <PreviewView matrix={matrix} scope={activeScope} category={activeCategory} />
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