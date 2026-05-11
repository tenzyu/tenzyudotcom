"use client";

import type { AssetMatrixCell, AssetMatrixRow } from "@tenzyu/osu-skin-core/project";
import { desktopFileSrc } from "../lib/tauri/project-command.adapter";

type Props = {
  row: AssetMatrixRow;
  cell: AssetMatrixCell;
};

export function AssetPreview({ row, cell }: Props) {
  if (cell.missing) {
    return <div className="miniPreview missingPreview">missing</div>;
  }

  const firstAsset = cell.assets[0];
  const fileName = firstAsset?.file.name ?? row.componentId;
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
    const fullPath = firstAsset?.file.fullPath;
    return (
      <div className="miniPreview imagePreview">
        {fullPath ? (
          <img src={desktopFileSrc(fullPath)} alt={fileName} loading="lazy" />
        ) : (
          <span>no preview</span>
        )}
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
