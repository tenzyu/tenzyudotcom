"use client";

type ScopeTab = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  scopes: ScopeTab[];
  activeScope: string;
  activeCategory: string;
  onScope: (scope: string) => void;
  onCategory: (category: string) => void;
};

export function Sidebar(props: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandHeader">
          <h1>osu! Skin Editor</h1>
        </div>
        <p>Lazer-first, Stable later.</p>
      </div>

      <section>
        <h2>Project</h2>
        <label>
          Project name
          <input placeholder="No project loaded yet" disabled />
        </label>
        <label>
          Main skin
          <input placeholder="Import flow is not connected yet" disabled />
        </label>
        <div className="buttonRow">
          <button type="button" disabled>
            Choose .osk
          </button>
          <button type="button" disabled>
            Choose folder
          </button>
        </div>
        <button type="button" className="primary" disabled>
          Import main skin
        </button>
      </section>

      <section>
        <h2>Scopes</h2>
        <div className="sourceList">
          {props.scopes.map((scope) => (
            <button
              key={scope.id}
              type="button"
              className={scope.id === props.activeScope ? "tab active" : "tab"}
              onClick={() => props.onScope(scope.id)}
            >
              {scope.label} {scope.count}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Current Selection</h2>
        <p className="muted">
          Scope: <strong>{props.activeScope}</strong>
        </p>
        <p className="muted">
          Category: <strong>{props.activeCategory || "none"}</strong>
        </p>
      </section>

      <section>
        <h2>Migration State</h2>
        <p className="muted">
          This shell uses <code>src/lib</code> classification and matrix builders. File import/export APIs are not
          connected yet.
        </p>
      </section>
    </aside>
  );
}