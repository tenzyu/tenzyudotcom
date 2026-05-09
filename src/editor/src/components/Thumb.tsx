import { useEffect, useState } from "react";
import type { MatrixCell, MatrixRow } from "../../../shared/editor-types";
import { AudioPreview } from "./AudioPreview";

type Props = {
  cell: MatrixCell;
  row: MatrixRow;
};

export function Thumb({ cell, row }: Props) {
  const files = [...cell.files].sort((a, b) => (a.sequenceIndex ?? 999999) - (b.sequenceIndex ?? 999999));
  const images = files.filter((file) => file.kind === "image");
  const audio = files.find((file) => file.kind === "audio");
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % images.length), 240);
    return () => window.clearInterval(timer);
  }, [images.length]);

  if (audio) return <AudioPreview file={audio} label={row.groupLabel} />;
  if (images.length) {
    const image = images[frame % images.length];
    return (
      <div className="miniPreview">
        <img src={image.url} alt={row.groupLabel} />
      </div>
    );
  }
  return <div className="miniPreview">{cell.missing ? "Missing" : (files[0]?.kind || "file").toUpperCase()}</div>;
}
