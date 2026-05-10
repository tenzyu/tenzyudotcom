import { getCurrentWindow } from "@tauri-apps/api/window";

export function AppTitlebar() {
  const appWindow = getCurrentWindow();

  return (
    <header className="appTitlebar">
      <div className="titlebarDragRegion" data-tauri-drag-region>
        <div className="titlebarBrand" data-tauri-drag-region>
          <span className="titlebarDot" />
          <span data-tauri-drag-region>osu! Skin Workbench</span>
        </div>
      </div>

      <div className="titlebarControls">
        <button
          type="button"
          className="titlebarButton"
          aria-label="Minimize"
          onClick={() => void appWindow.minimize()}
        >
          —
        </button>

        <button
          type="button"
          className="titlebarButton"
          aria-label="Toggle maximize"
          onClick={() => void appWindow.toggleMaximize()}
        >
          □
        </button>

        <button
          type="button"
          className="titlebarButton close"
          aria-label="Close"
          onClick={() => void appWindow.close()}
        >
          ×
        </button>
      </div>
    </header>
  );
}
