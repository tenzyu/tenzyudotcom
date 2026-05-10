"use client";

import type { AssetMatrixCell, AssetMatrixRow } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import { fileSrc } from "../lib/client/project-api";

export type AssetPreviewSide = "project" | "source";

type Props = {
  projectId: string | null;
  sourceId: string | null;
  side: AssetPreviewSide;
  row: AssetMatrixRow;
  cell: AssetMatrixCell;
};

export function AssetPreview({ cell }: Props) {
  if (cell.missing) {
    return <div className="miniPreview">Missing</div>;
  }

  const image = cell.assets.find((asset) => asset.kind === "image");

  if (image) {
    const url = image.file.fullPath ? fileSrc(image.file.fullPath) : null;

    return (
      <div className="miniPreview">
        {url ? <img src={url} alt={image.file.name} loading="lazy" /> : <span>{image.file.name}</span>}
      </div>
    );
  }

  const audio = cell.assets.find((asset) => asset.kind === "audio");

  if (audio) {
    const url = audio.file.fullPath ? fileSrc(audio.file.fullPath) : null;

    return (
      <div className="miniPreview audioPreview">
        {url ? <audio controls preload="none" src={url} /> : <span>{audio.file.name}</span>}
        <div className="audioLabel">
          <strong>{audio.file.name}</strong>
          <span>{audio.file.relativePath}</span>
        </div>
      </div>
    );
  }

  return <div className="miniPreview">{cell.previewKind.toUpperCase()}</div>;
}
