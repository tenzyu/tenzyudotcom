import type { MatrixRow, ProjectFilesResponse, SourceManifest, ValidationWarning } from "../../../shared/editor-types";
import { label } from "../format";
import { Thumb } from "./Thumb";

type Props = {
  files: ProjectFilesResponse;
  scope: string;
  category: string;
  sourceId: string;
  selectedRows: Set<string>;
  filter: string;
  meaningfulOnly: boolean;
  collapseStable: boolean;
  sourceFilterMode: string;
  density: string;
  onScope: (scope: string) => void;
  onCategory: (category: string) => void;
  onSource: (sourceId: string) => void;
  onFilter: (value: string) => void;
  onMeaningfulOnly: (value: boolean) => void;
  onCollapseStable: (value: boolean) => void;
  onSourceFilterMode: (value: string) => void;
  onDensity: (value: string) => void;
  onToggleRow: (rowKey: string) => void;
  onSelectRows: (rows: MatrixRow[]) => void;
  onClearRows: (rows?: MatrixRow[]) => void;
  onCopySelected: () => void;
  onDeleteGroup: (row: MatrixRow) => void;
  onRestoreMain: (row: MatrixRow) => void;
  onEditText: (path: string) => void;
  onOpenWarnings: () => void;
  onJumpWarning: (warning: ValidationWarning) => void;
};

export function EditView(props: Props) {
  const categories = [...new Set(props.files.matrix.rows.filter((row) => row.scope === props.scope).map((row) => row.category))].sort();
  const activeWarnings = props.files.validation.warnings.filter((warning) => !warning.ignored);
  const rows = visibleRows(props);
  const source = props.files.sources.find((candidate) => candidate.id === props.sourceId);

  return (
    <>
      <nav className="tabs">
        {props.files.scopes.map((scope) => {
          const count = props.files.matrix.rows.filter((row) => row.scope === scope && row.groupKey !== "__rule__").length;
          if (!count) return null;
          return <button key={scope} className={`tab${scope === props.scope ? " active" : ""}`} onClick={() => props.onScope(scope)}>{label(scope)} {count}</button>;
        })}
      </nav>
      <nav className="tabs subTabs">
        {categories.map((category) => {
          const count = props.files.matrix.rows.filter((row) => row.scope === props.scope && row.category === category && row.groupKey !== "__rule__").length;
          return <button key={category} className={`tab${category === props.category ? " active" : ""}`} onClick={() => props.onCategory(category)}>{label(category)} {count}</button>;
        })}
      </nav>
      <section className={`compareShell ${props.density === "compact" ? "compactRows" : ""}`}>
        <div className="compareTools">
          <input value={props.filter} onChange={(event) => props.onFilter(event.target.value)} placeholder="Filter assets" />
          <label className="inlineControl"><input type="checkbox" checked={props.meaningfulOnly} onChange={(event) => props.onMeaningfulOnly(event.target.checked)} /> Lazer meaningful only</label>
          <label className="inlineControl"><input type="checkbox" checked={props.collapseStable} onChange={(event) => props.onCollapseStable(event.target.checked)} /> Collapse stable later</label>
          <select value={props.sourceFilterMode} onChange={(event) => props.onSourceFilterMode(event.target.value)}>
            <option value="all">All rows</option>
            <option value="missing">Missing in project</option>
            <option value="different">Different from project</option>
            <option value="warnings">Warnings</option>
            <option value="hd">Has HD</option>
            <option value="sd">Has SD</option>
          </select>
          <select value={props.density} onChange={(event) => props.onDensity(event.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
          <button onClick={() => props.onSelectRows(rows.filter((row) => !(row.cells[props.sourceId]?.missing ?? true)))}>Select visible</button>
          <button onClick={() => props.onSelectRows(rows.filter((row) => row.cells.project.missing && !(row.cells[props.sourceId]?.missing ?? true)))}>Select missing</button>
          <button onClick={() => props.onSelectRows(rows.filter((row) => hasWarnings(row, props.sourceId) && !(row.cells[props.sourceId]?.missing ?? true)))}>Select warnings</button>
          <button onClick={() => props.onClearRows()}>Clear selection</button>
          <button onClick={() => props.onClearRows(rows)}>Clear category</button>
          <button className="primary" onClick={props.onCopySelected}>Copy selected</button>
        </div>

        <ValidationSummary warnings={activeWarnings} onOpen={props.onOpenWarnings} onJump={props.onJumpWarning} />

        <div className="compareHeader">
          <div><h3>Project</h3><p className="muted">{rows.filter((row) => !row.cells.project.missing).length} present</p></div>
          <div>
            <h3>Asset Source</h3>
            <select value={props.sourceId} onChange={(event) => props.onSource(event.target.value)}>
              {props.files.sources.map((item: SourceManifest) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p className="muted">{source ? `${source.name} · ${rows.filter((row) => !(row.cells[source.id]?.missing ?? true)).length} present` : "No source selected"}</p>
          </div>
        </div>
        <p className="muted">{label(props.scope)} / {label(props.category || "none")} · {rows.length} rows · {props.selectedRows.size} selected</p>
        <div className="assetRows">
          {rows.map((row) => (
            <div className="assetPairRow" key={row.rowKey}>
              <AssetRow row={row} columnId="project" side="project" selected={false} onToggle={() => undefined} onDeleteGroup={props.onDeleteGroup} onRestoreMain={props.onRestoreMain} onEditText={props.onEditText} />
              <AssetRow row={row} columnId={props.sourceId} side="source" selected={props.selectedRows.has(row.rowKey)} onToggle={() => props.onToggleRow(row.rowKey)} onDeleteGroup={props.onDeleteGroup} onRestoreMain={props.onRestoreMain} onEditText={props.onEditText} />
            </div>
          ))}
          {!rows.length && <div className="emptyState">No rows match the current filters.</div>}
        </div>
      </section>
    </>
  );
}

function ValidationSummary({ warnings, onOpen, onJump }: { warnings: ValidationWarning[]; onOpen: () => void; onJump: (warning: ValidationWarning) => void }) {
  if (!warnings.length) return <div className="validationSummary quiet"><strong>No active warnings</strong><span className="muted"> ignored warnings stay available in the list.</span></div>;
  const counts = warnings.reduce<Record<string, number>>((acc, warning) => {
    acc[warning.type] = (acc[warning.type] || 0) + 1;
    return acc;
  }, {});
  return (
    <div className="validationSummary">
      <div className="warningCounts">
        <strong>{warnings.length} warnings</strong>
        {Object.entries(counts).map(([type, count]) => (
          <button key={type} onClick={() => onJump(warnings.find((warning) => warning.type === type) || warnings[0])}>{label(type)} {count}</button>
        ))}
      </div>
      <button onClick={onOpen}>View warnings</button>
    </div>
  );
}

function AssetRow(props: {
  row: MatrixRow;
  columnId: string;
  side: "project" | "source";
  selected: boolean;
  onToggle: () => void;
  onDeleteGroup: (row: MatrixRow) => void;
  onRestoreMain: (row: MatrixRow) => void;
  onEditText: (path: string) => void;
}) {
  const cell = props.row.cells[props.columnId] || { files: [], missing: true, warnings: [], hasHd: false, hasSd: false, previewKind: "empty" };
  const textFile = props.side === "project" ? cell.files.find((file) => file.kind === "text") : undefined;
  const firstWarning = [...props.row.warnings, ...cell.warnings][0];
  return (
    <div data-row-key={props.row.rowKey} className={`assetRow ${props.side}AssetRow${cell.missing ? " missing" : ""}${props.selected ? " selected" : ""}${props.row.lazerMeaningful ? "" : " legacy"}`} onClick={props.side === "source" && !cell.missing ? props.onToggle : undefined}>
      <Thumb cell={cell} row={props.row} />
      <div className="assetRowText">
        <strong>{props.row.groupLabel}</strong>
        <span>{label(props.row.category)} · {cell.files.length} files{props.row.lazerMeaningful ? "" : " · Stable later"}</span>
        {firstWarning && <div className={`warningText ${props.side === "project" ? "projectWarning" : "sourceWarning"}`}>{props.side === "project" ? "Project" : "Source"}: {firstWarning.message}</div>}
      </div>
      <div className="cellMeta">
        {cell.hasHd && <span className="badge badgeHD">HD</span>}
        {cell.hasSd && <span className="badge badgeSD">SD</span>}
        {props.side === "source" && !cell.missing && <span className="selectMark">{props.selected ? "✓" : ""}</span>}
      </div>
      <div className="fileChips compact">
        {cell.files.slice(0, 4).map((file) => <span key={file.path}>{file.name}</span>)}
        {cell.files.length > 4 && <span>+{cell.files.length - 4}</span>}
      </div>
      <div className="cardActions">
        {textFile && <button className="smallAction" onClick={() => props.onEditText(textFile.path)}>Edit</button>}
        {props.side === "project" && !cell.missing && <button className="smallAction dangerButton" onClick={() => props.onDeleteGroup(props.row)}>Delete</button>}
        {props.side === "project" && props.row.cells.main && !props.row.cells.main.missing && <button className="smallAction" onClick={() => props.onRestoreMain(props.row)}>Restore from main</button>}
      </div>
    </div>
  );
}

function visibleRows(props: Props) {
  const filter = props.filter.trim().toLowerCase();
  return props.files.matrix.rows.filter((row) => {
    if (row.scope !== props.scope || row.category !== props.category) return false;
    if (row.groupKey === "__rule__") return false;
    if (props.meaningfulOnly && !row.lazerMeaningful) return false;
    if (props.collapseStable && row.scope === "stable") return false;
    const project = row.cells.project;
    const source = row.cells[props.sourceId] || { files: [], missing: true, warnings: [], hasHd: false, hasSd: false };
    if (props.sourceFilterMode === "missing" && !project.missing) return false;
    if (props.sourceFilterMode === "different" && (source.missing || source.files.map((file) => file.flatPath).join("|") === project.files.map((file) => file.flatPath).join("|"))) return false;
    if (props.sourceFilterMode === "warnings" && !hasWarnings(row, props.sourceId)) return false;
    if (props.sourceFilterMode === "hd" && !project.hasHd && !source.hasHd) return false;
    if (props.sourceFilterMode === "sd" && !project.hasSd && !source.hasSd) return false;
    if (!filter) return true;
    const haystack = [row.groupLabel, row.category, row.scope, ...project.files.map((file) => file.flatPath), ...source.files.map((file) => file.flatPath)].join(" ").toLowerCase();
    return haystack.includes(filter);
  });
}

function hasWarnings(row: MatrixRow, sourceId: string) {
  return Boolean(row.warnings.length || row.cells.project.warnings.length || row.cells[sourceId]?.warnings.length);
}
