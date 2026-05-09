"use client";

import { useMemo, useState } from "react";
import { classificationRules } from "../../lib/classification/classification-rules";
import { buildAssetMatrix, type AssetMatrixRowSeed } from "../../lib/project/asset-matrix-builder";
import { EditView } from "../../components/EditView";
import { PreviewView } from "../../components/PreviewView";
import { Sidebar } from "../../components/Sidebar";

type ViewMode = "edit" | "preview";

function rowSeedsFromRules(): AssetMatrixRowSeed[] {
  return classificationRules.map((rule) => ({
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
    taxonomyPath: rule.path,
    groupKey: rule.path.groupId,
    groupLabel: rule.path.groupLabel,
    kind: rule.kind,
    meaning: rule.meaning,
  }));
}

export default function Page() {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [activeScope, setActiveScope] = useState("std");
  const [activeCategory, setActiveCategory] = useState("hit-circles");
  const [filter, setFilter] = useState("");
  const [meaningfulOnly, setMeaningfulOnly] = useState(true);
  const [collapseStable, setCollapseStable] = useState(false);

  const matrix = useMemo(
    () =>
      buildAssetMatrix({
        project: [],
        sources: [],
        rowSeeds: rowSeedsFromRules(),
      }),
    [],
  );

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

  function selectScope(scopeId: string) {
    setActiveScope(scopeId);

    const firstCategory = matrix.rows.find((row) => row.scope === scopeId)?.category;
    setActiveCategory(firstCategory ?? "");
  }

  return (
    <main className="app">
      <Sidebar
        scopes={scopes}
        activeScope={activeScope}
        activeCategory={activeCategory}
        onScope={selectScope}
        onCategory={setActiveCategory}
      />

      <section className="main">
        <header className="toolbar">
          <div>
            <h2>osu! Skin Editor</h2>
            <p>Lazer-first skin editor. Next.js migration shell.</p>
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
            <button type="button">Import</button>
            <button type="button">Export</button>
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