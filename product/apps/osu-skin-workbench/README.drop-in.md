# osu-skin-workbench full @tenzyu/ui replacement drop-in

This drop-in replaces the workbench app shell and major screens with `@tenzyu/ui` components.

## Scope

Included files:

```txt
product/apps/osu-skin-workbench/src/main.tsx
product/apps/osu-skin-workbench/src/App.tsx
product/apps/osu-skin-workbench/src/styles.css
product/apps/osu-skin-workbench/src/components/AppTitlebar.tsx
product/apps/osu-skin-workbench/src/components/ProjectHubClient.tsx
product/apps/osu-skin-workbench/src/components/ProjectWorkspaceClient.tsx
product/apps/osu-skin-workbench/src/components/Sidebar.tsx
product/apps/osu-skin-workbench/src/components/EditView.tsx
product/apps/osu-skin-workbench/src/components/PreviewView.tsx
product/apps/osu-skin-workbench/src/components/AssetPreview.tsx
product/apps/osu-skin-workbench/src/components/CompareAssetCard.tsx
product/apps/osu-skin-workbench/src/components/AssetRow.tsx
product/apps/osu-skin-workbench/src/components/EditorPreviewPanel.tsx
```

## What changed

- Raw `button`, `input`, `select`, card-like `div` usage was replaced with `@tenzyu/ui` primitives where the component boundary matters.
- `@tenzyu/ui/styles.css` is imported before the workbench stylesheet.
- The workbench root is forced to dark mode.
- The workbench stylesheet now styles `@tenzyu/ui` `data-slot` attributes for the Tauri/Vite surface, so it does not rely on the web app Tailwind pipeline.
- Hub, sidebar, workspace header, edit matrix, compare cards, preview, asset rows, and titlebar are dark-first.
- The old light/default shadcn-looking collapse is bypassed.

## Required dependency

Make sure `product/apps/osu-skin-workbench/package.json` can resolve `@tenzyu/ui`:

```json
{
  "dependencies": {
    "@tenzyu/ui": "workspace:*"
  }
}
```

Make sure `@tenzyu/ui` exposes both root components and styles:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles.css"
  }
}
```

## Apply

From the parent directory that contains `product/`:

```bash
unzip osu-skin-workbench-full-ui-replacement.zip -d .
bun install
bun run --filter @tenzyu/osu-skin-workbench dev
```

If your repository root is already `product/`, copy the contents under `product/` into the current root.

## Verification

Check these first:

- the app starts in dark mode
- the titlebar is dark and compact
- checkbox controls are normal Radix/@tenzyu/ui controls, not huge browser inputs
- Project Hub uses `Card`, `Input`, `Label`, `Button`, `Badge`, `Surface`
- Workspace header actions use `Button`
- Sidebar source management uses `Card`, `Input`, `NativeSelect`, `Button`, `Badge`
- Edit matrix uses `Checkbox`, `NativeSelect`, `Card`, `Surface`, `Badge`, `Button`


## v2 browser-safe fix

This version intentionally avoids importing from the `@tenzyu/ui` root barrel.

Bad in Vite/Tauri browser code:

```ts
import { Button, Card } from "@tenzyu/ui";
```

Good:

```ts
import { Button } from "@tenzyu/ui/button";
import { Card, CardContent } from "@tenzyu/ui/card";
```

Reason: a root barrel can force Vite to inspect/evaluate unrelated exports such as chart, calendar, command, sonner, or token utilities. If any transitive module uses Node-only APIs such as `node:module.createRequire`, Vite externalizes `node:module` for browser compatibility and the runtime can fail with:

```txt
TypeError: createRequire is not a function
```

This version also removes `import "@tenzyu/ui/styles.css"` from `main.tsx`.
The workbench stylesheet defines the required dark semantic tokens and runtime styling itself, so the app does not need to load the package CSS in the Tauri renderer.


## v3 root import

This version depends on the curated `@tenzyu/ui` root barrel.

Workbench app code now uses:

```ts
import { Button, Card, Input, Label } from "@tenzyu/ui";
```

The package root is safe because `packages/ui/src/index.ts` no longer re-exports heavy or environment-sensitive modules.
