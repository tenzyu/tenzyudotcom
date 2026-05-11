"use client";


import { useMemo, useState } from "react";
import type {
  AssetMatrix,
  AssetMatrixCell,
  AssetMatrixRow,
} from "@tenzyu/osu-skin-core/project";
import {
  filterAssetRows,
  type RequiredLevelFilter,
} from "@tenzyu/osu-skin-core/project";
import { CompareAssetCard } from "./CompareAssetCard";
import { EditorPreviewPanel } from "./EditorPreviewPanel";
import { Badge } from "@tenzyu/ui/badge";
import { Button } from "@tenzyu/ui/button";
import { Card, CardContent } from "@tenzyu/ui/card";
import { Checkbox } from "@tenzyu/ui/checkbox";
import { Input } from "@tenzyu/ui/input";
import { Label } from "@tenzyu/ui/label";
import { NativeSelect } from "@tenzyu/ui/native-select";

type Props = {
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
    [props.matrix.rows, props.scope, props.category, props.filter, props.meaningfulOnly, props.collapseStable, requiredLevel],
  );

  const activeScope = props.matrix.rows.find((row) => row.scope === props.scope)?.taxonomy.scope;
  const activeCategory = props.matrix.rows.find((row) => row.scope === props.scope && row.category === props.category)?.taxonomy.category;
  const sourceColumns = props.matrix.columns.filter((column) => column.kind === "source");
  const activeSourceColumn = sourceColumns.find((column) => column.id === props.selectedSourceId) ?? sourceColumns[0] ?? null;
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
      if (sourceCell.cell.missing) continue;

      await props.onCopySourceRow({
        sourceId: activeSourceColumn.id,
        sourcePaths: pathsFromCell(sourceCell.cell),
        replaceProjectPaths: pathsFromCell(row.cells.project),
      });
    }

    setSelectedRows(new Set());
  }

  return (
    <section className={`editView density-${density}`}>
      <Card variant="soft" className="filterBar">
        <CardContent className="filterBarContent">
          <div className="fieldStack filterSearch">
            <Label htmlFor="asset-filter">Filter assets</Label>
            <Input
              id="asset-filter"
              value={props.filter}
              onChange={(event) => props.onFilter(event.target.value)}
              placeholder="hitcircle, cursor, menu, comboburst..."
            />
          </div>

          <div className="fieldStack">
            <Label htmlFor="source-column-select">Asset Source</Label>
            <NativeSelect
              id="source-column-select"
              value={activeSourceColumn?.id ?? ""}
              onChange={(event) => props.onSelectedSourceId(event.target.value)}
              disabled={!sourceColumns.length}
            >
              {sourceColumns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="fieldStack compactField">
            <Label htmlFor="required-level">Rows</Label>
            <NativeSelect
              id="required-level"
              value={requiredLevel}
              onChange={(event) => setRequiredLevel(event.target.value as RequiredLevelFilter)}
            >
              <option value="all">All rows</option>
              <option value="required">Required</option>
              <option value="recommended">Recommended</option>
              <option value="optional">Optional</option>
            </NativeSelect>
          </div>

          <div className="fieldStack compactField">
            <Label htmlFor="density">Density</Label>
            <NativeSelect id="density" value={density} onChange={(event) => setDensity(event.target.value)}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </NativeSelect>
          </div>

          <div className="toggleStack">
            <label className="checkboxLine">
              <Checkbox checked={props.meaningfulOnly} onCheckedChange={(checked) => props.onMeaningfulOnly(checked === true)} />
              <span>Lazer meaningful only</span>
            </label>
            <label className="checkboxLine">
              <Checkbox checked={props.collapseStable} onCheckedChange={(checked) => props.onCollapseStable(checked === true)} />
              <span>Collapse stable later</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="actionStrip">
        <div className="actionStripStats">
          <Badge variant="secondary">{rows.length} rows</Badge>
          <Badge variant="secondary">Project {projectPresent}</Badge>
          <Badge variant="secondary">Source {sourcePresent}</Badge>
          <Badge variant="secondary">Warnings {warnings.total}</Badge>
        </div>
        <div className="actionStripButtons">
          <Button type="button" variant="soft" size="sm" onClick={() => selectRows(rows.filter((row) => row.cells.project.missing))}>
            Select missing
          </Button>
          <Button type="button" variant="soft" size="sm" onClick={() => selectRows(rows.filter(rowHasWarning))}>
            Select warnings
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedRows(new Set())}>
            Clear selection
          </Button>
          <Button type="button" size="sm" onClick={() => void copySelectedRows()} disabled={!activeSourceColumn || selectedVisibleCount === 0}>
            Copy selected ({selectedVisibleCount})
          </Button>
        </div>
      </div>

      <div className={`validationSummary ${warnings.total ? "statusWarning" : "statusQuiet"}`}>
        <div>
          <strong>{warnings.total} warnings</strong>
          <span>
            HD only {warnings.hdOnly} · Missing {warnings.missing} · Scope {activeScope?.label ?? props.scope} / {activeCategory?.label ?? props.category}
          </span>
        </div>
        <Button type="button" variant="soft" size="sm" onClick={() => selectRows(rows.filter(rowHasWarning))}>
          View warnings
        </Button>
      </div>

      <div className="editorWorkArea">
        <div className="compareShell">
          <div className="compareHeader">
            <div>
              <p className="eyebrow compactEyebrow">Compare Matrix</p>
              <h2>Project ⇄ {activeSourceColumn?.label ?? "Asset Source"}</h2>
            </div>
            <p className="mutedText">{selectedVisibleCount} selected</p>
          </div>

          <div className="compareTable">
            <div className="compareTableHeader">
              <span />
              <span>Asset</span>
              <span>Project</span>
              <span>Source</span>
              <span>Actions</span>
            </div>

            {activeSourceColumn ? (
              rows.map((row) => {
                const sourceCell = sourceCellFor(row, activeSourceColumn.id);
                return (
                  <CompareAssetCard
                    key={row.rowKey}
                    row={row}
                    projectCell={row.cells.project}
                    sourceCell={sourceCell.cell}
                    selected={selectedRows.has(row.rowKey)}
                    onToggle={() => toggleRow(row.rowKey)}
                    onCopy={() =>
                      void props.onCopySourceRow({
                        sourceId: activeSourceColumn.id,
                        sourcePaths: pathsFromCell(sourceCell.cell),
                        replaceProjectPaths: pathsFromCell(row.cells.project),
                      })
                    }
                    onDelete={() => props.onDeleteProjectRow(pathsFromCell(row.cells.project))}
                    onRestore={() =>
                      void props.onCopySourceRow({
                        sourceId: activeSourceColumn.id,
                        sourcePaths: pathsFromCell(sourceCell.cell),
                        replaceProjectPaths: pathsFromCell(row.cells.project),
                      })
                    }
                  />
                );
              })
            ) : (
              <div className="emptyState">
                Add an asset source to compare against the project skin.
              </div>
            )}
          </div>
        </div>

        <EditorPreviewPanel rows={rows} scope={props.scope} category={props.category} warningCount={warnings.total} />
      </div>
    </section>
  );
}

function sourceCellFor(row: AssetMatrixRow, sourceId: string | undefined): SourceCell {
  if (!sourceId) return { cell: emptyCell() };

  const cells = row.cells as Record<string, AssetMatrixCell>;
  return { cell: cells[sourceId] ?? emptyCell() };
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

function pathsFromCell(cell: AssetMatrixCell): string[] {
  return cell.assets
    .map((asset) => {
      const file = asset.file as { relativePath?: string; path?: string; fullPath?: string; name?: string };
      return file.relativePath ?? file.path ?? file.fullPath ?? file.name;
    })
    .filter((path): path is string => Boolean(path));
}

function warningSummary(rows: AssetMatrixRow[]) {
  let hdOnly = 0;
  let missing = 0;
  let total = 0;

  for (const row of rows) {
    total += row.warnings.length;
    for (const cell of Object.values(row.cells)) {
      total += cell.warnings.length;
      if (cell.hasHd && !cell.hasSd) hdOnly += 1;
      if (cell.missing) missing += 1;
    }
  }

  return { hdOnly, missing, total };
}
