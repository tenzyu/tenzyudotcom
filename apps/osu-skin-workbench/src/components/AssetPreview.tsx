"use client";

import type { AssetMatrixCell, AssetMatrixRow } from "../lib/project/asset-matrix-builder";

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
    return <div className="miniPreview">Missing</div>;
  }

  const image = cell.assets.find((asset) => asset.kind === "image");

  if (image) {
    const url = blobUrl({ projectId, side, sourceId, relativePath: image.file.relativePath });

    return (
      <div className="miniPreview">
        {url ? <img src={url} alt={image.file.name} loading="lazy" /> : <span>{image.file.name}</span>}
      </div>
    );
  }

  const audio = cell.assets.find((asset) => asset.kind === "audio");

  if (audio) {
    const url = blobUrl({ projectId, side, sourceId, relativePath: audio.file.relativePath });

    return (
      <div className="miniPreview audioPreview">
        {url ? <audio controls preload="none" src={url} /> : <span>{audio.file.name}</span>}
        <div className="audioLabel">
          <strong>{row.groupLabel}</strong>
          <span>{audio.file.name}</span>
        </div>
      </div>
    );
  }

  return <div className="miniPreview">{cell.previewKind.toUpperCase()}</div>;
}

function blobUrl(input: {
  projectId: string | null;
  side: AssetPreviewSide;
  sourceId: string | null;
  relativePath: string;
}): string | null {
  if (!input.projectId) return null;

  const params = new URLSearchParams({
    scope: input.side === "project" ? "project" : "source",
    path: input.relativePath,
  });

  if (input.side === "source" && input.sourceId) {
    params.set("sourceId", input.sourceId);
  }

  return `/api/projects/${encodeURIComponent(input.projectId)}/blob?${params.toString()}`;
}
