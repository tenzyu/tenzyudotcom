// Preview rebuild details are tracked in PLAN.md.
"use client";

import { useMemo, useState } from "react";
import type { AssetMatrix, AssetMatrixRow } from "../lib/project/asset-matrix-builder";

type PreviewTab = "overview" | string;

const preferredPreviewScopes = ["std", "taiko", "catch", "mania", "sounds", "stable"] as const;

type Props = {
  matrix: AssetMatrix;
  scope: string;
  category: string;
};

export function PreviewView({ matrix, scope, category }: Props) {
  const [tab, setTab] = useState<PreviewTab>("overview");
  const tabs = useMemo(() => previewTabsFor(matrix), [matrix]);

  const rows = useMemo(() => {
    if (tab === "overview") return matrix.rows;
    return matrix.rows.filter((row) => row.scope === tab);
  }, [matrix.rows, tab]);

  const currentRows = useMemo(
    () => matrix.rows.filter((row) => row.scope === scope && row.category === category),
    [category, matrix.rows, scope],
  );

  return (
    <section className="previewShell">
      <div className="previewTabs">
        {tabs.map(({ id, label }) => (
          <button key={id} type="button" className={`tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="previewStage">
        <div className={`lazerPreview ${tab}`}>
          <PreviewStage tab={tab} rows={rows} />
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

function previewTabsFor(matrix: AssetMatrix): Array<{ id: PreviewTab; label: string }> {
  const scopes = new Map<string, string>();

  for (const row of matrix.rows) {
    scopes.set(row.scope, row.taxonomy.scope.label);
  }

  const orderedScopes = [
    ...preferredPreviewScopes.filter((scope) => scopes.has(scope)),
    ...[...scopes.keys()]
      .filter((scope) => !preferredPreviewScopes.includes(scope as (typeof preferredPreviewScopes)[number]))
      .sort((a, b) => (scopes.get(a) ?? a).localeCompare(scopes.get(b) ?? b)),
  ];

  return [
    { id: "overview", label: "Overview" },
    ...orderedScopes.map((scope) => ({ id: scope, label: scopes.get(scope) ?? scope })),
  ];
}

function PreviewStage({ tab, rows }: { tab: PreviewTab; rows: AssetMatrixRow[] }) {
  if (tab === "sounds") return <SoundsPreview rows={rows} />;
  if (tab === "stable") return <ArchivePreview rows={rows} />;
  if (tab === "std" || tab === "taiko" || tab === "catch" || tab === "mania") {
    return <GameplayPreview mode={tab} rows={rows} />;
  }

  return <OverviewPreview rows={rows} />;
}

function OverviewPreview({ rows }: { rows: AssetMatrixRow[] }) {
  return (
    <div className="previewMock">
      <h2>Lazer-first Taxonomy Overview</h2>
      <p>
        {rows.length} taxonomy rows · {rows.filter((row) => row.lazerMeaningful).length} lazer meaningful
      </p>

      <PreviewStats rows={rows} />
      <PreviewRowList rows={rows} />
    </div>
  );
}

function GameplayPreview({ mode, rows }: { mode: string; rows: AssetMatrixRow[] }) {
  return (
    <div className="previewMock gameplayMock">
      <h2>{previewTitle(mode)}</h2>
      <p>
        {rows.length} rows · {rows.filter((row) => row.lazerMeaningful).length} primary editor rows
      </p>

      <div className={`gameplayStage ${mode}`}>
        <div className="songSelectStrip">
          <span>{mode}</span>
          <strong>{rows.find((row) => row.lazerMeaningful)?.groupLabel ?? "No primary asset"}</strong>
        </div>
        <div className="playfieldMock">
          {rows.slice(0, 6).map((row) => (
            <span key={row.rowKey} className={row.lazerMeaningful ? "primaryDot" : "legacyDot"} />
          ))}
        </div>
      </div>

      <PreviewStats rows={rows} />
      <PreviewRowList rows={rows} />
    </div>
  );
}

function SoundsPreview({ rows }: { rows: AssetMatrixRow[] }) {
  return (
    <div className="previewMock">
      <h2>Sounds Preview Rack</h2>
      <p>{rows.length} sound rows available for playback and comparison.</p>
      <PreviewStats rows={rows} />
      <PreviewRowList rows={rows} />
    </div>
  );
}

function ArchivePreview({ rows }: { rows: AssetMatrixRow[] }) {
  return (
    <div className="previewMock">
      <h2>Stable Later Archive</h2>
      <p>{rows.length} preserved rows are outside the primary lazer editor flow.</p>
      <PreviewStats rows={rows} />
      <PreviewRowList rows={rows} />
    </div>
  );
}

function PreviewStats({ rows }: { rows: AssetMatrixRow[] }) {
  return (
    <div className="previewStats">
      <PreviewStat label="Required" value={countByRequired(rows, "required")} />
      <PreviewStat label="Recommended" value={countByRequired(rows, "recommended")} />
      <PreviewStat label="Optional" value={countByRequired(rows, "optional")} />
      <PreviewStat label="Stable later" value={rows.filter((row) => row.scope === "stable").length} />
    </div>
  );
}

function PreviewRowList({ rows }: { rows: AssetMatrixRow[] }) {
  return (
    <div className="previewRows">
      {rows.slice(0, 16).map((row) => (
        <PreviewRow key={row.rowKey} row={row} />
      ))}
    </div>
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

function previewTitle(tab: string) {
  switch (tab) {
    case "std":
      return "osu!standard Preview Model";
    case "taiko":
      return "osu!taiko Preview Model";
    case "catch":
      return "osu!catch Preview Model";
    case "mania":
      return "osu!mania Preview Model";
    case "sounds":
      return "Sounds Preview Model";
    case "stable":
      return "Stable Later Archive";
    default:
      return "Lazer-first Taxonomy Overview";
  }
}
