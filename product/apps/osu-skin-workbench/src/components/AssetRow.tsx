"use client";

import type { AssetMatrixCell, AssetMatrixRow } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import { AssetPreview, type AssetPreviewSide } from "./AssetPreview";

type Props = {
  projectId: string | null;
  row: AssetMatrixRow;
  cell: AssetMatrixCell;
  side: AssetPreviewSide;
  sourceId: string | null;
  onCopy?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
};

export function AssetRow({ projectId, row, cell, side, sourceId, onCopy, onDelete, onRestore }: Props) {
  return (
    <div
      className={[
        "assetRow",
        side === "project" ? "projectAssetRow" : "sourceAssetRow",
        cell.missing ? " missing" : "",
        row.lazerMeaningful ? "" : " legacy",
      ].join("")}
    >
      <AssetPreview
        projectId={projectId}
        sourceId={sourceId}
        side={side}
        row={row}
        cell={cell}
      />

      <div className="assetRowText">
        <strong>{row.groupLabel}</strong>
        <span>
          {row.taxonomy.category.label} · {row.componentId}
        </span>
        <span>
          {row.lazerMeaningful ? "Lazer meaningful" : "Stable later"} · {row.requiredLevel}
        </span>
        {row.warnings[0] && (
          <div className="warningText">
            {side === "project" ? "Project" : "Source"}: {row.warnings[0].message}
          </div>
        )}
      </div>

      <div className="cellMeta">
        {cell.hasHd && <span className="badge badgeHD">HD</span>}
        {cell.hasSd && <span className="badge badgeSD">SD</span>}
        <span className="badge">{row.kind}</span>
      </div>

      <div className="rowActions">
        {side === "source" && !cell.missing && (
          <button type="button" className="sourceSelectCircle" onClick={onCopy} title="Copy this source row">
            ○
          </button>
        )}
        {side === "project" && !cell.missing && (
          <>
            <button type="button" className="danger" onClick={onDelete}>
              Delete
            </button>
            <button type="button" onClick={onRestore} disabled={!onRestore}>
              Restore from main
            </button>
          </>
        )}
      </div>

      <div className="fileChips compact">
        {cell.assets.slice(0, 4).map((asset) => (
          <span key={asset.file.relativePath}>{asset.file.name}</span>
        ))}
        {cell.assets.length > 4 && <span>+{cell.assets.length - 4}</span>}
        {!cell.assets.length && <span>No file</span>}
      </div>
    </div>
  );
}
