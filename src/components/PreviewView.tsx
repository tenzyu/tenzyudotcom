"use client";

import { useMemo, useState } from "react";
import type { AssetMatrix, AssetMatrixRow } from "../lib/project/asset-matrix-builder";

type PreviewTab = "overview" | "std" | "taiko" | "catch" | "mania" | "audio" | "stable";

const tabs: Array<[PreviewTab, string]> = [
  ["overview", "Overview"],
  ["std", "Std"],
  ["taiko", "Taiko"],
  ["catch", "Catch"],
  ["mania", "Mania"],
  ["audio", "Audio"],
  ["stable", "Stable Later"],
];

type Props = {
  matrix: AssetMatrix;
  scope: string;
  category: string;
};

export function PreviewView({ matrix, scope, category }: Props) {
  const [tab, setTab] = useState<PreviewTab>("overview");

  const rows = useMemo(() => {
    if (tab === "overview") return matrix.rows;
    if (tab === "audio") return matrix.rows.filter((row) => row.scope === "sounds");
    if (tab === "stable") return matrix.rows.filter((row) => row.scope === "stable");
    return matrix.rows.filter((row) => row.scope === tab);
  }, [matrix.rows, tab]);

  const currentRows = useMemo(
    () => matrix.rows.filter((row) => row.scope === scope && row.category === category),
    [category, matrix.rows, scope],
  );

  return (
    <section className="previewShell">
      <div className="previewTabs">
        {tabs.map(([id, text]) => (
          <button key={id} type="button" className={`tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
            {text}
          </button>
        ))}
      </div>

      <div className="previewStage">
        <div className={`lazerPreview ${tab}`}>
          <div className="previewMock">
            <h2>{previewTitle(tab)}</h2>
            <p>
              {rows.length} taxonomy rows · {rows.filter((row) => row.lazerMeaningful).length} lazer meaningful
            </p>

            <div className="previewStats">
              <PreviewStat label="Required" value={countByRequired(rows, "required")} />
              <PreviewStat label="Recommended" value={countByRequired(rows, "recommended")} />
              <PreviewStat label="Optional" value={countByRequired(rows, "optional")} />
              <PreviewStat label="Stable later" value={rows.filter((row) => row.scope === "stable").length} />
            </div>

            <div className="previewRows">
              {rows.slice(0, 16).map((row) => (
                <PreviewRow key={row.rowKey} row={row} />
              ))}
            </div>
          </div>
        </div>

        <div className="previewAudioRack">
          <strong>Current Category</strong>
          <p className="muted">
            {scope} / {category}
          </p>

          {currentRows.slice(0, 12).map((row) => (
            <div className="validationWarning" key={row.rowKey}>
              <strong>{row.groupLabel}</strong>
              <div>
                {row.componentId} · {row.lazerMeaningful ? "lazer" : "stable later"}
              </div>
            </div>
          ))}

          {!currentRows.length && <span className="muted">No rows in the current category.</span>}
        </div>
      </div>
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="validationPanel">
      <strong>{value}</strong>
      <span className="muted">{label}</span>
    </div>
  );
}

function PreviewRow({ row }: { row: AssetMatrixRow }) {
  return (
    <div className="sourceRow">
      <div>
        <strong>{row.groupLabel}</strong>
        <div className="muted">
          {row.taxonomy.scope.label} / {row.taxonomy.category.label}
        </div>
      </div>
      <span className="badge">{row.lazerMeaningful ? "lazer" : "stable"}</span>
    </div>
  );
}

function countByRequired(rows: AssetMatrixRow[], level: AssetMatrixRow["requiredLevel"]) {
  return rows.filter((row) => row.requiredLevel === level).length;
}

function previewTitle(tab: PreviewTab) {
  switch (tab) {
    case "std":
      return "osu!standard Preview Model";
    case "taiko":
      return "osu!taiko Preview Model";
    case "catch":
      return "osu!catch Preview Model";
    case "mania":
      return "osu!mania Preview Model";
    case "audio":
      return "Audio Preview Model";
    case "stable":
      return "Stable Later Archive";
    default:
      return "Lazer-first Taxonomy Overview";
  }
}