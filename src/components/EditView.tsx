"use client";

import type {
  AssetMatrix,
  AssetMatrixCell,
  AssetMatrixRow,
} from "../lib/project/asset-matrix-builder";

type Props = {
  matrix: AssetMatrix;
  scope: string;
  category: string;
  filter: string;
  meaningfulOnly: boolean;
  collapseStable: boolean;
  onFilter: (value: string) => void;
  onMeaningfulOnly: (value: boolean) => void;
  onCollapseStable: (value: boolean) => void;
};

export function EditView(props: Props) {
  const rows = visibleRows(props);
  const activeScope = props.matrix.rows.find((row) => row.scope === props.scope)?.taxonomy.scope;
  const activeCategory = props.matrix.rows.find((row) => row.scope === props.scope && row.category === props.category)
    ?.taxonomy.category;

  return (
    <section className="compareShell">
      <div className="compareTools">
        <input
          value={props.filter}
          onChange={(event) => props.onFilter(event.target.value)}
          placeholder="Filter assets"
        />

        <label className="inlineControl">
          <input
            type="checkbox"
            checked={props.meaningfulOnly}
            onChange={(event) => props.onMeaningfulOnly(event.target.checked)}
          />
          Lazer meaningful only
        </label>

        <label className="inlineControl">
          <input
            type="checkbox"
            checked={props.collapseStable}
            onChange={(event) => props.onCollapseStable(event.target.checked)}
          />
          Collapse stable later
        </label>

        <button type="button" disabled>
          Select visible
        </button>
        <button type="button" disabled>
          Copy selected
        </button>
      </div>

      <div className="validationSummary quiet">
        <strong>Library-backed classification</strong>
        <span className="muted">
          {props.matrix.rows.length} rule rows from <code>src/lib/classification</code>.
        </span>
      </div>

      <div className="compareHeader">
        <div>
          <h3>Project</h3>
          <p className="muted">No project assets loaded yet.</p>
        </div>
        <div>
          <h3>Asset Source</h3>
          <p className="muted">No source assets loaded yet.</p>
        </div>
      </div>

      <p className="muted">
        {activeScope?.label ?? props.scope} / {activeCategory?.label ?? props.category || "none"} · {rows.length} rows
      </p>

      <div className="assetRows">
        {rows.map((row) => (
          <div className="assetPairRow" key={row.rowKey}>
            <AssetRow row={row} cell={row.cells.project} side="project" />
            <AssetRow row={row} cell={firstSourceCell(row) ?? emptyCell()} side="source" />
          </div>
        ))}

        {!rows.length && <div className="emptyState">No rows match the current filters.</div>}
      </div>
    </section>
  );
}

function AssetRow(props: {
  row: AssetMatrixRow;
  cell: AssetMatrixCell;
  side: "project" | "source";
}) {
  const { row, cell } = props;

  return (
    <div
      className={[
        "assetRow",
        props.side === "project" ? "projectAssetRow" : "sourceAssetRow",
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
        {row.warnings[0] && <div className="warningText">{row.warnings[0].message}</div>}
      </div>

      <div className="cellMeta">
        {cell.hasHd && <span className="badge badgeHD">HD</span>}
        {cell.hasSd && <span className="badge badgeSD">SD</span>}
        <span className="badge">{row.kind}</span>
      </div>

      <div className="fileChips compact">
        {cell.assets.slice(0, 4).map((asset) => (
          <span key={asset.file.relativePath}>{asset.file.name}</span>
        ))}
        {cell.assets.length > 4 && <span>+{cell.assets.length - 4}</span>}
        {!cell.assets.length && <span>No file</span>}
      </div>
    </div>
  );
}

function AssetPreview({ row, cell }: { row: AssetMatrixRow; cell: AssetMatrixCell }) {
  if (cell.missing) {
    return <div className="miniPreview">Missing</div>;
  }

  const image = cell.assets.find((asset) => asset.kind === "image");

  if (image) {
    return (
      <div className="miniPreview">
        <span>{image.file.name}</span>
      </div>
    );
  }

  const audio = cell.assets.find((asset) => asset.kind === "audio");

  if (audio) {
    return (
      <div className="miniPreview audioPreview">
        <button type="button" disabled>
          Play
        </button>
        <div className="audioLabel">
          <strong>{row.groupLabel}</strong>
          <span>{audio.file.name}</span>
        </div>
        <div className="audioMeter">
          <span />
        </div>
        <span className="audioDuration">--:--</span>
      </div>
    );
  }

  return <div className="miniPreview">{cell.previewKind.toUpperCase()}</div>;
}

function visibleRows(props: Props) {
  const filter = props.filter.trim().toLowerCase();

  return props.matrix.rows.filter((row) => {
    if (row.scope !== props.scope) return false;
    if (row.category !== props.category) return false;
    if (props.meaningfulOnly && !row.lazerMeaningful) return false;
    if (props.collapseStable && row.scope === "stable") return false;

    if (!filter) return true;

    const haystack = [
      row.groupLabel,
      row.componentId,
      row.scope,
      row.category,
      row.groupKey,
      row.taxonomy.label,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(filter);
  });
}

function firstSourceCell(row: AssetMatrixRow): AssetMatrixCell | null {
  const sourceColumnId = Object.keys(row.cells).find((key) => key !== "project");
  return sourceColumnId ? row.cells[sourceColumnId] ?? null : null;
}

function emptyCell(): AssetMatrixCell {
  return {
    assets: [],
    missing: true,
    hasHd: false,
    hasSd: false,
    warnings: [],
    previewKind: "empty",
  };
}