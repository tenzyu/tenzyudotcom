"use client";

import { Button } from "@tenzyu/ui/button";
import { Badge } from '@tenzyu/ui/badge'
import { Card } from "@tenzyu/ui/card";

import type { AssetMatrixCell, AssetMatrixRow } from "@tenzyu/osu-skin-core/project";
import { AssetPreview } from "./AssetPreview";

export type AssetPreviewSide = "project" | "source";

type Props = {
  row: AssetMatrixRow;
  cell: AssetMatrixCell;
  side: AssetPreviewSide;
  onCopy?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
};

export function AssetRow({ row, cell, side, onCopy, onDelete, onRestore }: Props) {
  return (
    <Card
      variant="soft"
      className={[
        "assetRow",
        side === "project" ? "projectAssetRow" : "sourceAssetRow",
        cell.missing ? " missing" : "",
        row.lazerMeaningful ? "" : " legacy",
      ].join("")}
    >
      <AssetPreview row={row} cell={cell} />

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
        {cell.hasHd && <Badge variant="secondary">HD</Badge>}
        {cell.hasSd && <Badge variant="secondary">SD</Badge>}
        <Badge variant="outline">{row.kind}</Badge>
      </div>

      <div className="rowActions">
        {side === "source" && !cell.missing && (
          <Button type="button" size="xs" onClick={onCopy} title="Copy this source row">
            Copy
          </Button>
        )}
        {side === "project" && !cell.missing && (
          <>
            <Button type="button" size="xs" variant="soft" onClick={onRestore}>
              Restore
            </Button>
            <Button type="button" size="xs" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </>
        )}
      </div>

      {cell.assets.length > 1 && (
        <div className="fileChips">
          {cell.assets.slice(0, 8).map((asset) => (
            <span key={asset.file.name}>{asset.file.name}</span>
          ))}
          {cell.assets.length > 8 && <span>+{cell.assets.length - 8}</span>}
        </div>
      )}
    </Card>
  );
}
