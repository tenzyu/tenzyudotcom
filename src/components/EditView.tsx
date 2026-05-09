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

  return (
    <section className="compareShell">
      <div className="compareTools">
        <input
          value={props.filter}
          onChange={(event) => props.onFilter(event.target.value)}
          placeholder="Filter assets"
        />

        <label>
          Required level
          <select
            value={requiredLevel}
            onChange={(event) => setRequiredLevel(event.target.value as RequiredLevelFilter)}
          >
            <option value="all">All levels</option>
            <option value="required">Required</option>
            <option value="recommended">Recommended</option>
            <option value="optional">Optional</option>
          </select>
        </label>

        <label className="inlineControl">
          <input
            type="checkbox"
            checked={props.meaningfulOnly}
            onChange={(event) => {
              props.onMeaningfulOnly(event.target.checked);
              props.onCollapseStable(event.target.checked);
            }}
          />
          Primary editor rows
        </label>

        <label>
          Asset source
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
        </label>
      </div>

      <div className="validationSummary quiet">
        <strong>Library-backed classification</strong>
        <span className="muted">
          {props.matrix.rows.length} rule rows from <code>src/lib/classification</code>.
        </span>
      </div>

      <div className="compareHeader">
        <div>
          <h3>Project</h3>
          <p className="muted">No project assets loaded yet.</p>
        </div>
        <div>
          <h3>Asset Source</h3>
          <p className="muted">{activeSourceColumn?.label ?? "No source assets loaded yet."}</p>
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
