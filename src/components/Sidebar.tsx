// Remaining sidebar cleanup is tracked in PLAN.md.
"use client";

import type { ProjectManifest } from "../lib/shared/project-contract";

type ScopeTab = {
  id: string;
  label: string;
  count: number;
};

type CategoryTab = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  projects: ProjectManifest[];
  project: ProjectManifest | null;

  projectName: string;
  mainPath: string;
  assetName: string;
  assetPath: string;

  scopes: ScopeTab[];
  categories: CategoryTab[];
  activeScope: string;
  activeCategory: string;

  loading: boolean;
  status: string;
  error: string | null;

  onProjectName: (value: string) => void;
  onMainPath: (value: string) => void;
  onAssetName: (value: string) => void;
  onAssetPath: (value: string) => void;

  onClose: () => void;
  onImportMain: () => void;
  onImportAsset: () => void;
  onChooseAssetPath: () => void;
  onProjectSelect: (projectId: string) => void;
  onRefresh: () => void;
  onSourceRename: (sourceId: string, name: string) => void;
  onSourceDelete: (sourceId: string) => void;

  onScope: (scope: string) => void;
  onCategory: (category: string) => void;
};

export function Sidebar(props: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandHeader">
          <h1>osu! Skin Editor</h1>
          <button type="button" className="ghostButton" onClick={props.onClose}>
            Close
          </button>
        </div>
        <p>Lazer-first, Stable later.</p>
      </div>

      <section>
        <h2>Main Skin</h2>

        <label>
          Project name
          <input
            value={props.projectName}
            onChange={(event) => props.onProjectName(event.target.value)}
            placeholder="optional"
            disabled={props.loading}
          />
        </label>

        <label>
          Path
          <input
            value={props.mainPath}
            onChange={(event) => props.onMainPath(event.target.value)}
            placeholder="skins/example.osk or /absolute/skin/folder"
            disabled={props.loading}
          />
        </label>

        <button
          type="button"
          className="primary"
          onClick={props.onImportMain}
          disabled={props.loading || !props.mainPath.trim()}
        >
          Import main skin
        </button>

        <p className="muted">Project creation moved to the hub. Paste a local path there for now.</p>
      </section>

      <section>
        <h2>Projects</h2>

        <select
          value={props.project?.id ?? ""}
          onChange={(event) => props.onProjectSelect(event.target.value)}
          disabled={props.loading || !props.projects.length}
        >
          <option value="">Select project</option>
          {props.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <button type="button" onClick={props.onRefresh} disabled={props.loading}>
          Refresh projects
        </button>

        {props.project && (
          <p className="muted">
            {props.project.name}
            <br />
            {props.project.mainSourcePath}
          </p>
        )}
      </section>

      <section>
        <h2>Asset Skin</h2>

        <label>
          Name
          <input
            value={props.assetName}
            onChange={(event) => props.onAssetName(event.target.value)}
            placeholder="optional"
            disabled={props.loading || !props.project}
          />
        </label>

        <label>
          Path
          <input
            value={props.assetPath}
            onChange={(event) => props.onAssetPath(event.target.value)}
            placeholder="skins/source.osk or /absolute/source/folder"
            disabled={props.loading || !props.project}
          />
        </label>

        <button
          type="button"
          onClick={props.onChooseAssetPath}
          disabled={props.loading || !props.project}
        >
          Choose .osk or folder
        </button>

        <button
          type="button"
          onClick={props.onImportAsset}
          disabled={props.loading || !props.project || !props.assetPath.trim()}
        >
          Add asset source
        </button>
      </section>

      <section>
        <h2>Asset Sources</h2>

        <div className="sourceList">
          {props.project?.sources.map((source) => (
            <div className="sourceRow" key={source.id}>
              <div>
                <strong>{source.name}</strong>
                <div className="muted">{source.sourcePath}</div>
              </div>
              <div className="sourceActions">
                <button
                  type="button"
                  onClick={() => {
                    const name = window.prompt("Asset source name", source.name);
                    if (name && name !== source.name) props.onSourceRename(source.id, name);
                  }}
                  disabled={props.loading}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (window.confirm(`Delete asset source "${source.name}"?`)) {
                      props.onSourceDelete(source.id);
                    }
                  }}
                  disabled={props.loading || source.readonly}
                  title={source.readonly ? "Main source cannot be deleted" : undefined}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {!props.project?.sources.length && <span className="muted">No asset sources.</span>}
        </div>
      </section>

      <section>
        <h2>Status</h2>
        <p className="muted">{props.loading ? "Loading..." : props.status}</p>
        {props.error && <p className="warningText">{props.error}</p>}
      </section>
    </aside>
  );
}
