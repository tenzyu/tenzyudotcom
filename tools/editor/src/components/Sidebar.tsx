import type { ProjectManifest } from "../../../shared/editor-types";
import { basename } from "../format";

type Props = {
  workspaceRoot: string;
  projects: ProjectManifest[];
  project: ProjectManifest | null;
  sources: ProjectManifest["sources"];
  recent: string[];
  mainPath: string;
  assetPath: string;
  projectName: string;
  assetName: string;
  collapsed: boolean;
  onCollapse: () => void;
  onChoose: (target: "main" | "asset", kind: "file" | "directory") => void;
  onImportMain: () => void;
  onImportBackup: () => void;
  onProjectName: (value: string) => void;
  onMainPath: (value: string) => void;
  onAssetName: (value: string) => void;
  onAssetPath: (value: string) => void;
  onProjectSelect: (id: string) => void;
  onRefresh: () => void;
  onImportAsset: () => void;
  onDeleteSource: (id: string) => void;
  onReimportRecent: (path: string) => void;
  disabledSources: Set<string>;
  onToggleSource: (id: string) => void;
};

export function Sidebar(props: Props) {
  if (props.collapsed) return null;
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandHeader">
          <h1>osu! Skin Editor</h1>
          <button title="Collapse sidebar" aria-label="Collapse sidebar" onClick={props.onCollapse}>‹</button>
        </div>
        <p>{props.workspaceRoot || "Loading workspace..."}</p>
      </div>

      <section>
        <h2>Main Skin</h2>
        <label>Project name<input value={props.projectName} onChange={(event) => props.onProjectName(event.target.value)} placeholder="optional" /></label>
        <label>Path<input value={props.mainPath} onChange={(event) => props.onMainPath(event.target.value)} placeholder="choose a .osk or folder" /></label>
        <div className="buttonRow">
          <button onClick={() => props.onChoose("main", "file")}>Choose .osk</button>
          <button onClick={() => props.onChoose("main", "directory")}>Choose folder</button>
        </div>
        <button className="primary" onClick={props.onImportMain}>Import main skin</button>
        <button onClick={props.onImportBackup}>Import backup</button>
      </section>

      <section>
        <h2>Projects</h2>
        <select value={props.project?.id || ""} onChange={(event) => props.onProjectSelect(event.target.value)}>
          {props.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <button onClick={props.onRefresh}>Refresh</button>
      </section>

      <section>
        <h2>Asset Skin</h2>
        <label>Name<input value={props.assetName} onChange={(event) => props.onAssetName(event.target.value)} placeholder="optional" /></label>
        <label>Path<input value={props.assetPath} onChange={(event) => props.onAssetPath(event.target.value)} placeholder="choose a .osk or folder" /></label>
        <div className="buttonRow">
          <button onClick={() => props.onChoose("asset", "file")}>Choose .osk</button>
          <button onClick={() => props.onChoose("asset", "directory")}>Choose folder</button>
        </div>
        <button onClick={props.onImportAsset}>Add asset source</button>
      </section>

      <section>
        <h2>Asset Sources</h2>
        <div className="sourceList">
          {props.sources.map((source) => (
            <div className="sourceRow" key={source.id}>
              <label className="sourceToggle">
                <input type="checkbox" checked={!props.disabledSources.has(source.id)} onChange={() => props.onToggleSource(source.id)} />
                <span><strong>{source.name}</strong><div className="muted">{Object.keys(source.files).length} files · {source.sourcePath}</div></span>
              </label>
              <button className="smallAction dangerButton" onClick={() => props.onDeleteSource(source.id)}>Delete</button>
            </div>
          ))}
          {!props.sources.length && <span className="muted">No asset sources.</span>}
          {!!props.recent.length && (
            <div className="recentSources">
              <div className="muted">Recent sources</div>
              {props.recent.slice(0, 3).map((path) => (
                <button key={path} title={path} onClick={() => props.onReimportRecent(path)}>Reimport {basename(path)}</button>
              ))}
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
