"use client";

import { useMemo, useState } from "react";
import type {
  AssetMatrix,
  AssetMatrixCell,
  AssetMatrixRow,
} from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import {
  filterAssetRows,
  type RequiredLevelFilter,
} from "@tenzyu/osu-skin-core/lib/project/asset-row-filter";
import { CompareAssetCard } from "./CompareAssetCard";
import { EditorPreviewPanel } from "./EditorPreviewPanel";

type Props = {
  projectId: string | null;
  matrix: AssetMatrix;
  selectedSourceId: string;
  scope: string;
  category: string;
  filter: string;
  meaningfulOnly: boolean;
  collapseStable: boolean;
  onSelectedSourceId: (value: string) => void;
  onFilter: (value: string) => void;
  onMeaningfulOnly: (value: boolean) => void;
  onCollapseStable: (value: boolean) => void;
  onCopySourceRow: (input: {
    sourceId: string;
    sourcePaths: string[];
    replaceProjectPaths: string[];
  }) => Promise<void> | void;
  onDeleteProjectRow: (projectPaths: string[]) => void;
};

type SourceCell = {
  sourceId: string | null;
  cell: AssetMatrixCell;
};

export function EditView(props: Props) {
  const [requiredLevel, setRequiredLevel] = useState<RequiredLevelFilter>("all");
  const [density, setDensity] = useState("comfortable");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const rows = useMemo(
    () =>
      filterAssetRows(props.matrix.rows, {
        scope: props.scope,
        category: props.category,
        text: props.filter,
        primaryRowsOnly: props.meaningfulOnly,
        collapseStable: props.collapseStable,
        requiredLevel,
      }),
    [props, requiredLevel],
  );
  const activeScope = props.matrix.rows.find((row) => row.scope === props.scope)?.taxonomy.scope;
  const activeCategory = props.matrix.rows.find((row) => row.scope === props.scope && row.category === props.category)
    ?.taxonomy.category;
  const sourceColumns = props.matrix.columns.filter((column) => column.kind === "source");
  const activeSourceColumn =
    sourceColumns.find((column) => column.id === props.selectedSourceId) ?? sourceColumns[0] ?? null;
  const warnings = warningSummary(props.matrix.rows);
  const projectPresent = rows.filter((row) => !row.cells.project.missing).length;
  const sourcePresent = activeSourceColumn
    ? rows.filter((row) => !sourceCellFor(row, activeSourceColumn.id).cell.missing).length
    : 0;
  const selectedVisibleCount = rows.filter((row) => selectedRows.has(row.rowKey)).length;

  function toggleRow(rowKey: string) {
    setSelectedRows((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  }

  function selectRows(nextRows: AssetMatrixRow[]) {
    setSelectedRows(new Set(nextRows.map((row) => row.rowKey)));
  }

  function rowHasWarning(row: AssetMatrixRow) {
    return row.warnings.length > 0 || Object.values(row.cells).some((cell) => cell.warnings.length > 0);
  }

  async function copySelectedRows() {
    if (!activeSourceColumn || selectedRows.size === 0) return;

    for (const row of rows) {
      if (!selectedRows.has(row.rowKey)) continue;
      const sourceCell = sourceCellFor(row, activeSourceColumn.id);
      if (!sourceCell.sourceId || sourceCell.cell.missing) continue;

      await props.onCopySourceRow({
        sourceId: sourceCell.sourceId,
        sourcePaths: sourceCell.cell.assets.map((asset) => asset.file.relativePath),
        replaceProjectPaths: row.cells.project.assets.map((asset) => asset.file.relativePath),
      });
    }
  }

  return (
    <section className={`compareShell density-${density}`}>
      <div className="compareTools">
        <input
          value={props.filter}
          onChange={(event) => props.onFilter(event.target.value)}
          placeholder="Filter assets"
        />

        <label className="inlineControl">
          <input
            type="checkbox"
            checked={props.meaningfulOnly}
            onChange={(event) => {
              props.onMeaningfulOnly(event.target.checked);
            }}
          />
          Lazer meaningful only
        </label>

        <label className="inlineControl">
          <input
            type="checkbox"
            checked={props.collapseStable}
            onChange={(event) => props.onCollapseStable(event.target.checked)}
          />
          Collapse stable later
        </label>

        <label className="compactSelect">
          <select
            value={requiredLevel}
            onChange={(event) => setRequiredLevel(event.target.value as RequiredLevelFilter)}
          >
            <option value="all">All rows</option>
            <option value="required">Required</option>
            <option value="recommended">Recommended</option>
            <option value="optional">Optional</option>
          </select>
        </label>

        <label className="compactSelect">
          <select value={density} onChange={(event) => setDensity(event.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>

        <button type="button" onClick={() => selectRows(rows)}>
          Select visible
        </button>
        <button type="button" onClick={() => selectRows(rows.filter((row) => row.cells.project.missing))}>
          Select missing
        </button>
        <button type="button" onClick={() => selectRows(rows.filter(rowHasWarning))}>
          Select warnings
        </button>
        <button type="button" onClick={() => setSelectedRows(new Set())}>
          Clear selection
        </button>
        <button type="button" onClick={() => setSelectedRows((current) => {
          const visible = new Set(rows.map((row) => row.rowKey));
          return new Set([...current].filter((rowKey) => !visible.has(rowKey)));
        })}>
          Clear category
        </button>

        <button
          type="button"
          className="primary copySelectedButton"
          onClick={() => void copySelectedRows()}
          disabled={!selectedVisibleCount || !activeSourceColumn}
        >
          Copy selected ({selectedVisibleCount})
        </button>
      </div>

      <div className="validationSummary">
        <div>
          <strong>{warnings.total} warnings</strong>
          {warnings.hdOnly > 0 && <span className="badge">HdOnly {warnings.hdOnly}</span>}
          {warnings.missing > 0 && <span className="badge">Missing {warnings.missing}</span>}
        </div>
        <button type="button">View warnings</button>
      </div>

      <div className="compareHeader">
        <div>
          <h3>Project</h3>
          <p className="muted">{projectPresent} present</p>
        </div>
        <div>
          <h3>Asset Source</h3>
          <select
            value={activeSourceColumn?.id ?? ""}
            onChange={(event) => props.onSelectedSourceId(event.target.value)}
            disabled={!sourceColumns.length}
          >
            {!sourceColumns.length && <option value="">No asset source</option>}
            {sourceColumns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.label}
              </option>
            ))}
          </select>
          <p className="muted">
            {activeSourceColumn?.label ?? "No source assets loaded yet"} · {sourcePresent} present
          </p>
        </div>
      </div>

      <div className="scopeBreadcrumb">
        <span>
          {activeScope?.label ?? props.scope} / {activeCategory?.label ?? (props.category || "none")} · {rows.length} rows
        </span>
        <span>{selectedVisibleCount} selected</span>
      </div>

      <div className="editorWorkArea">
        <div className="compareTable">
          <div className="compareTableHeader">
            <span />
            <span>カテゴリ / アセット</span>
            <span>Project (My Skin)</span>
            <span>Source ({activeSourceColumn?.label ?? "none"})</span>
            <span>アクション</span>
          </div>

          {rows.map((row) => {
            const sourceCell = sourceCellFor(row, activeSourceColumn?.id);

            return (
              <CompareAssetCard
                key={row.rowKey}
                projectId={props.projectId}
                row={row}
                projectCell={row.cells.project}
                sourceCell={sourceCell.cell}
                sourceId={sourceCell.sourceId}
                selected={selectedRows.has(row.rowKey)}
                onToggle={() => toggleRow(row.rowKey)}
                onCopy={() => {
                  if (!sourceCell.sourceId) return;
                  void props.onCopySourceRow({
                    sourceId: sourceCell.sourceId,
                    sourcePaths: sourceCell.cell.assets.map((asset) => asset.file.relativePath),
                    replaceProjectPaths: row.cells.project.assets.map((asset) => asset.file.relativePath),
                  });
                }}
                onDelete={() =>
                  props.onDeleteProjectRow(row.cells.project.assets.map((asset) => asset.file.relativePath))
                }
                onRestore={() => {
                  const mainCell = sourceCellFor(row, "main");
                  if (!mainCell.sourceId || mainCell.cell.missing) return;

                  void props.onCopySourceRow({
                    sourceId: mainCell.sourceId,
                    sourcePaths: mainCell.cell.assets.map((asset) => asset.file.relativePath),
                    replaceProjectPaths: row.cells.project.assets.map((asset) => asset.file.relativePath),
                  });
                }}
              />
            );
          })}

          {!rows.length && <div className="emptyState">No rows match the current filters.</div>}
        </div>

        <EditorPreviewPanel
          rows={rows}
          scope={props.scope}
          category={props.category}
          warningCount={warnings.total}
        />
      </div>
    </section>
  );
}

function warningSummary(rows: AssetMatrixRow[]) {
  const allWarnings = rows.flatMap((row) => [
    ...row.warnings,
    ...Object.values(row.cells).flatMap((cell) => cell.warnings),
  ]);

  return {
    total: allWarnings.length,
    hdOnly: allWarnings.filter((warning) => warning.type === "hdOnly").length,
    missing: allWarnings.filter((warning) => warning.type === "missing").length,
  };
}

function sourceCellFor(row: AssetMatrixRow, sourceColumnId: string | undefined): SourceCell {
  if (!sourceColumnId) return { sourceId: null, cell: emptyCell() };

  return {
    sourceId: sourceColumnId,
    cell: row.cells[sourceColumnId] ?? emptyCell(),
  };
}

function emptyCell(): AssetMatrixCell {
  return {
    assets: [],
    missing: true,
    hasHd: false,
    hasSd: false,
    warnings: [],
    previewKind: "empty",
  };
}
