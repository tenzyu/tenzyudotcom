"use client";

import type { AssetMatrixRow } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";

type Props = {
  rows: AssetMatrixRow[];
  scope: string;
  category: string;
  warningCount: number;
};

export function EditorPreviewPanel({ rows, scope, category, warningCount }: Props) {
  const primaryCount = rows.filter((row) => row.lazerMeaningful).length;
  const missingCount = rows.filter((row) => row.cells.project.missing).length;
  const audioRow = rows.find((row) => row.kind === "audio");

  return (
    <aside className="editorPreviewPanel">
      <h3>プレビュー</h3>
      <div className="previewModeTabs">
        <button type="button" className={scope === "std" ? "active" : ""}>Std</button>
        <button type="button" className={scope === "taiko" ? "active" : ""}>Taiko</button>
        <button type="button" className={scope === "catch" ? "active" : ""}>Catch</button>
        <button type="button" className={scope === "mania" ? "active" : ""}>Mania</button>
      </div>

      <div className="gamePreviewSurface">
        <div className="mockHitObject">3</div>
        <div className="mockApproach" />
        <div className="mockScore">123x</div>
      </div>

      <section className="compatPanel">
        <strong>互換性</strong>
        <CompatibilityRow label="lazer meaningful" value={primaryCount} tone="ok" />
        <CompatibilityRow label="stable only" value={rows.length - primaryCount} tone="info" />
        <CompatibilityRow label="missing" value={missingCount} tone="danger" />
        <CompatibilityRow label="warnings" value={warningCount} tone="warn" />
      </section>

      <section className="audioRack">
        <strong>音声プレビュー</strong>
        <p className="muted">{audioRow?.groupLabel ?? `${scope} / ${category}`}</p>
        <div className="waveformMock">
          <button type="button">▶</button>
          <span />
        </div>
      </section>
    </aside>
  );
}

function CompatibilityRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "info" | "danger" | "warn";
}) {
  return (
    <div className={`compatRow ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
