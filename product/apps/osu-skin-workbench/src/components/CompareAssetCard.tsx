"use client";

import { Badge } from "@tenzyu/ui/badge";
import { Button } from "@tenzyu/ui/button";
import { Card } from "@tenzyu/ui/card";
import { Checkbox } from "@tenzyu/ui/checkbox";

import type { AssetMatrixCell, AssetMatrixRow } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
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
    <Card variant="soft" className={`compareAssetCard${selected ? " selected" : ""}`}>
      <div className="rowCheckCell">
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label="Select asset row" />
      </div>

      <div className="assetIdentity">
        <strong>{row.groupLabel}</strong>
        <span>{row.cells.project.assets[0]?.file.name ?? sourceCell.assets[0]?.file.name ?? row.componentId}</span>
        <span>
          {Math.max(projectCell.assets.length, sourceCell.assets.length)} files · {row.requiredLevel}
        </span>
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
        <Button type="button" size="xs" onClick={onCopy} disabled={sourceCell.missing}>
          Copy
        </Button>
        <Button type="button" size="xs" variant="soft" onClick={onRestore} disabled={sourceCell.missing}>
          Restore
        </Button>
        <Button type="button" size="xs" variant="destructive" onClick={onDelete} disabled={projectCell.missing}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

function PreviewMeta({ label, cell }: { label: string; cell: AssetMatrixCell }) {
  const resolution = cell.hasHd ? "HD" : cell.hasSd ? "SD" : "missing";

  return (
    <div className="previewMeta">
      <strong>{label}</strong>
      <span>{cell.assets.length} files</span>
      <Badge variant={cell.missing ? "destructive" : "secondary"}>{resolution}</Badge>
      {cell.warnings.length > 0 && <Badge variant="secondary">{cell.warnings.length} warnings</Badge>}
    </div>
  );
}
