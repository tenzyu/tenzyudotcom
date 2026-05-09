"use client";

import type { AssetMatrixCell, AssetMatrixRow } from "../lib/project/asset-matrix-builder";
import { AssetPreview } from "./AssetPreview";

type Props = {
  projectId: string | null;
  row: AssetMatrixRow;
  projectCell: AssetMatrixCell;
  sourceCell: AssetMatrixCell;
  sourceId: string | null;
  selected: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onRestore: () => void;
};

export function CompareAssetCard({
  projectId,
  row,
  projectCell,
  sourceCell,
  sourceId,
  selected,
  onToggle,
  onCopy,
  onDelete,
  onRestore,
}: Props) {
  return (
    <div className={`compareAssetCard${selected ? " selected" : ""}`}>
      <button type="button" className="rowCheck" onClick={onToggle} title="Select asset row">
        {selected ? "✓" : ""}
      </button>

      <div className="assetIdentity">
        <strong>{row.groupLabel}</strong>
        <span>{row.cells.project.assets[0]?.file.name ?? sourceCell.assets[0]?.file.name ?? row.componentId}</span>
        <span>{Math.max(projectCell.assets.length, sourceCell.assets.length)} files</span>
      </div>

      <div className="comparePreview projectPreview">
        <AssetPreview projectId={projectId} sourceId={null} side="project" row={row} cell={projectCell} />
        <PreviewMeta label="Project" cell={projectCell} />
      </div>

      <div className="comparePreview sourcePreview">
        <AssetPreview projectId={projectId} sourceId={sourceId} side="source" row={row} cell={sourceCell} />
        <PreviewMeta label="Source" cell={sourceCell} />
      </div>

      <div className="compareActions">
        <button type="button" className="primary" onClick={onCopy} disabled={sourceCell.missing}>
          Copy to Project
        </button>
        <button type="button" onClick={onRestore} disabled={sourceCell.missing}>
          Restore
        </button>
        <button type="button" className="danger" onClick={onDelete} disabled={projectCell.missing}>
          Delete
        </button>
      </div>
    </div>
  );
}

function PreviewMeta({ label, cell }: { label: string; cell: AssetMatrixCell }) {
  const resolution = cell.hasHd ? "HD" : cell.hasSd ? "SD" : "";

  return (
    <div className="previewMeta">
      <span>{label}</span>
      {resolution && <span className={`badge badge${resolution}`}>{resolution}</span>}
    </div>
  );
}
