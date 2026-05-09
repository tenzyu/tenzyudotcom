"use client";

import { useMemo, useState } from "react";
import type {
  AssetMatrix,
  AssetMatrixCell,
  AssetMatrixRow,
} from "../lib/project/asset-matrix-builder";
import {
  filterAssetRows,
  type RequiredLevelFilter,
} from "../lib/project/asset-row-filter";
import { AssetRow } from "./AssetRow";

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
  }) => void;
  onDeleteProjectRow: (projectPaths: string[]) => void;
};

type SourceCell = {
  sourceId: string | null;
  cell: AssetMatrixCell;
};

export function EditView(props: Props) {
  const [requiredLevel, setRequiredLevel] = useState<RequiredLevelFilter>("all");
  const [density, setDensity] = useState("comfortable");
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

        <button type="button">Select visible</button>
        <button type="button">Select missing</button>
        <button type="button">Select warnings</button>
        <button type="button">Clear selection</button>
        <button type="button">Clear category</button>

        <button type="button" className="primary copySelectedButton">
          Copy selected
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

      <p className="muted">
        {activeScope?.label ?? props.scope} / {activeCategory?.label ?? (props.category || "none")} · {rows.length} rows
      </p>

      <div className="assetRows">
        {rows.map((row) => (
          <div className="assetPairRow" key={row.rowKey}>
            <AssetRow
              projectId={props.projectId}
              row={row}
              cell={row.cells.project}
              side="project"
              sourceId={null}
              onDelete={() =>
                props.onDeleteProjectRow(row.cells.project.assets.map((asset) => asset.file.relativePath))
              }
              onRestore={() => {
                const mainCell = sourceCellFor(row, "main");
                if (!mainCell.sourceId || mainCell.cell.missing) return;

                props.onCopySourceRow({
                  sourceId: mainCell.sourceId,
                  sourcePaths: mainCell.cell.assets.map((asset) => asset.file.relativePath),
                  replaceProjectPaths: row.cells.project.assets.map((asset) => asset.file.relativePath),
                });
              }}
            />
            <AssetRow
              projectId={props.projectId}
              row={row}
              cell={sourceCellFor(row, activeSourceColumn?.id).cell}
              side="source"
              sourceId={sourceCellFor(row, activeSourceColumn?.id).sourceId}
              onCopy={() => {
                const sourceCell = sourceCellFor(row, activeSourceColumn?.id);
                if (!sourceCell.sourceId) return;

                props.onCopySourceRow({
                  sourceId: sourceCell.sourceId,
                  sourcePaths: sourceCell.cell.assets.map((asset) => asset.file.relativePath),
                  replaceProjectPaths: row.cells.project.assets.map((asset) => asset.file.relativePath),
                });
              }}
            />
          </div>
        ))}

        {!rows.length && <div className="emptyState">No rows match the current filters.</div>}
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
