import { getCurrentWindow } from "@tauri-apps/api/window";
import { Button } from "@tenzyu/ui/button";

export function AppTitlebar() {
  const appWindow = getCurrentWindow();

  return (
    <header className="appTitlebar">
      <div className="titlebarDragRegion" data-tauri-drag-region>
        <div className="titlebarBrand" data-tauri-drag-region>
          <span className="titlebarDot" aria-hidden />
          <span data-tauri-drag-region>osu! Skin Workbench</span>
        </div>
      </div>

      <div className="titlebarControls">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="titlebarButton"
          aria-label="Minimize"
          onClick={() => void appWindow.minimize()}
        >
          —
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="titlebarButton"
          aria-label="Toggle maximize"
          onClick={() => void appWindow.toggleMaximize()}
        >
          □
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="titlebarButton close"
          aria-label="Close"
          onClick={() => void appWindow.close()}
        >
          ×
        </Button>
      </div>
    </header>
  );
}
