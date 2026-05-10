"use client";

import type { AssetMatrixCell, AssetMatrixRow } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";

export type AssetPreviewSide = "project" | "source";

type Props = {
  projectId: string | null;
  sourceId: string | null;
  side: AssetPreviewSide;
  row: AssetMatrixRow;
  cell: AssetMatrixCell;
};

export function AssetPreview({ projectId, sourceId, side, row, cell }: Props) {
  if (cell.missing) {
    return <div className="miniPreview missingPreview">missing</div>;
  }

  const firstAsset = cell.assets[0];
  const fileName = firstAsset?.file.name ?? row.componentId;
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
    const src = buildPreviewUrl({ projectId, sourceId, side, fileName });
    return (
      <div className="miniPreview imagePreview">
        <img src={src} alt={fileName} loading="lazy" />
      </div>
    );
  }

  if (["wav", "mp3", "ogg"].includes(extension)) {
    return (
      <div className="miniPreview audioPreview">
        <span>{extension}</span>
      </div>
    );
  }

  return <div className="miniPreview filePreview">{extension || row.kind}</div>;
}

function buildPreviewUrl(input: { projectId: string | null; sourceId: string | null; side: AssetPreviewSide; fileName: string }) {
  const params = new URLSearchParams();
  if (input.projectId) params.set("projectId", input.projectId);
  if (input.sourceId) params.set("sourceId", input.sourceId);
  params.set("side", input.side);
  params.set("file", input.fileName);
  return `/asset-preview?${params.toString()}`;
}
