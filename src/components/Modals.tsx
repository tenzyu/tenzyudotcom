import type { ReactNode } from "react";
import type { ExportResult, HistoryEntrySummary, MatrixRow, ValidationWarning } from "../../../shared/editor-types";
import { label } from "../format";
import { Thumb } from "./Thumb";

export function Modal({ title, children, onClose, footer }: { title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  return (
    <div className="overlay">
      <div className="modal">
        <header><h2>{title}</h2><button onClick={onClose}>Close</button></header>
        <div className="modalList">{children}</div>
        <footer>{footer || <button onClick={onClose}>Close</button>}</footer>
      </div>
    </div>
  );
}

export function WarningModal({ warnings, onClose, onJump, onIgnore }: {
  warnings: ValidationWarning[];
  onClose: () => void;
  onJump: (warning: ValidationWarning) => void;
  onIgnore: (warning: ValidationWarning) => void;
}) {
  return (
    <Modal title="Warnings" onClose={onClose}>
      {warnings.map((warning) => (
        <div className="validationWarning" key={warning.id}>
          <strong>{label(warning.type)} · {warning.ignored ? "Ignored" : "Active"}</strong>
          <div>{label(warning.scope)} / {label(warning.category)} / {warning.group}: {warning.message}</div>
          <div className="modalActions">
            <button onClick={() => onJump(warning)}>Jump</button>
            <button onClick={() => onIgnore(warning)}>{warning.ignored ? "Unignore" : "Ignore"}</button>
          </div>
        </div>
      ))}
      {!warnings.length && <span>No warnings.</span>}
    </Modal>
  );
}

export function HistoryModal({ history, onClose }: { history: HistoryEntrySummary[]; onClose: () => void }) {
  return (
    <Modal title="Undo History" onClose={onClose}>
      {history.map((entry) => (
        <div className="validationWarning" key={entry.id}>
          <strong>{entry.action}</strong>
          <div>{entry.affectedCount} files · {new Date(entry.createdAt).toLocaleString()}</div>
        </div>
      ))}
      {!history.length && <span>No undo history.</span>}
    </Modal>
  );
}

export function ConflictModal({ rows, sourceId, onClose, onApply }: {
  rows: MatrixRow[];
  sourceId: string;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <Modal title="Apply Changes" onClose={onClose} footer={<><button onClick={onClose}>Cancel</button><button className="primary" onClick={onApply}>Apply choices</button></>}>
      {rows.map((row) => (
        <div className="conflictRow" key={row.rowKey}>
          <div><strong>{row.groupLabel}</strong><div className="muted">{row.cells[sourceId]?.files.length || 0} files{row.cells.project.missing ? "" : " · replaces project files"}</div></div>
          <div className="conflictPreviews">
            <Thumb cell={row.cells.project} row={row} />
            <Thumb cell={row.cells[sourceId]} row={row} />
          </div>
          <strong>{row.cells.project.missing ? "Copy" : "Replace"}</strong>
        </div>
      ))}
    </Modal>
  );
}

export function ExportModal({ warnings, result, preset, onPreset, onClose, onRun }: {
  warnings: ValidationWarning[];
  result: ExportResult | null;
  preset: string;
  onPreset: (preset: string) => void;
  onClose: () => void;
  onRun: () => void;
}) {
  return (
    <Modal title="Export" onClose={onClose} footer={<button className="primary" onClick={onRun}>Export</button>}>
      <label>Preset
        <select value={preset} onChange={(event) => onPreset(event.target.value)}>
          <option value="full">Full</option>
          <option value="sd">SD only</option>
          <option value="hd">HD only</option>
          <option value="diff">Diff</option>
          <option value="backup">Backup</option>
        </select>
      </label>
      <p className="muted">{descriptionForPreset(preset)}</p>
      <div className="validationPanel">
        <strong>{warnings.filter((warning) => !warning.ignored).length} active warnings</strong>
        {warnings.filter((warning) => !warning.ignored).slice(0, 8).map((warning) => (
          <div className="validationWarning" key={warning.id}>{label(warning.scope)} / {label(warning.category)} / {warning.group}: {warning.message}</div>
        ))}
      </div>
      {result && (
        <div className="exportResult">
          <strong>Export result</strong>
          {result.resultSummary.map((item) => (
            <div className="exportResultRow" key={item.format}><span>{label(item.format)}</span><code>{item.path}</code><strong>{item.count} files</strong></div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function TextModal({ path, content, onContent, onClose, onSave }: {
  path: string;
  content: string;
  onContent: (content: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="overlay">
      <div className="modal textModal">
        <header><h2>{path}</h2><button onClick={onClose}>Close</button></header>
        <textarea id="textEditor" value={content} onChange={(event) => onContent(event.target.value)} />
        <footer><button className="primary" onClick={onSave}>Save</button></footer>
      </div>
    </div>
  );
}

export function ReclassifyModal({ preview, onClose, onApply }: {
  preview: {
    changed: number;
    unchanged: number;
    missing: number;
    moves: Array<{ move: string; count: number }>;
    examples: Array<{ flatPath: string; oldScope: string; oldCategory: string; oldGroup: string; newScope: string; newCategory: string; newGroup: string }>;
  };
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <Modal title="Reclassify Project" onClose={onClose} footer={<><button onClick={onClose}>Cancel</button><button className="primary" onClick={onApply}>Apply reclassify</button></>}>
      <div><strong>{preview.changed} changed</strong><div className="muted">{preview.unchanged} unchanged · {preview.missing} missing files · Undo supported</div></div>
      {preview.moves.map((move) => <div className="validationWarning" key={move.move}>{move.count} files: {move.move}</div>)}
      {preview.examples.map((item) => (
        <div className="validationWarning" key={`${item.flatPath}-${item.oldScope}`}>{item.flatPath}: {item.oldScope}/{item.oldCategory}/{item.oldGroup} -&gt; {item.newScope}/{item.newCategory}/{item.newGroup}</div>
      ))}
    </Modal>
  );
}

function descriptionForPreset(preset: string) {
  return {
    full: "Includes SD files, @2x files, stable later, and extras.",
    sd: "Includes normal-resolution files and excludes @2x assets for a lighter skin.",
    hd: "Includes @2x image assets where possible and excludes SD image assets.",
    diff: "Includes only files changed from the main source.",
    backup: "Includes the full editor project for restore or moving to another machine.",
  }[preset] || "";
}
