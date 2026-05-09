# Next.js Migration Remaining Work

## Summary

This project is now treated as a Next.js local-first osu! skin editor. The Vite/static version is not the source of truth anymore.

Current priorities are:

- keep `raw` files authoritative and `structured` folders generated
- finish project/source/export workflows in the browser UI
- keep classification reliable through tests
- split large UI components until humans can safely edit them

## Completed Baseline

- Root `/` is a project hub.
- `/projects/[projectId]` is the editor workspace.
- API contract types live in `src/lib/shared/project-contract.ts`.
- Client fetch wrappers live in `src/lib/client/project-api.ts`.
- Main skin is automatically added as readonly asset source `main`.
- Project storage creates:
  - `project/raw`
  - `project/structured`
  - `sources/[sourceId]/raw`
  - `sources/[sourceId]/structured`
- Export presets exist:
  - `full`
  - `sd-only`
  - `hd-only`
  - `diff`
  - `backup`
- Basic image and audio previews are wired through the blob API.
- Project rows can be deleted.
- Source rows can be copied into the project.
- Regression tests cover applause sounds, taiko shaker/playfield classification, main source creation, structured mirror creation, and export.
- `ARCHITECTURE.md` documents dependency direction and known boundaries.

## Remaining Work

### P0: Make Existing Workflows Reliable

- Add UI action to rebuild generated structured mirrors for project and sources.
- Make source selection explicit in the edit view instead of always showing the first source column.
- Keep `Primary editor rows` as the single UI toggle for lazer-meaningful primary rows and stable collapse.
- Done: remove disabled buttons from the edit toolbar; row-level Copy/Delete now provide the implemented edit path.
- Improve export result display with preset, output path, included file count, excluded file count, and notes.
- Done: Turbopack filesystem trace warning is resolved with scoped `turbopackIgnore` filesystem roots.
- Done: replace top-level `process.cwd()` constants with root helper functions.
- Decide whether `tsconfig.tsbuildinfo` should be ignored or intentionally tracked before publishing.

### P1: Split UI Responsibilities

- Done: split workspace state out of `ProjectWorkspaceClient` into hooks:
  - `useProjects`
  - `useProjectFiles`
  - `useAssetSourceActions`
  - `useAssetMatrixNavigation`
- Done: split edit view rendering:
  - `EditView`
  - `AssetRow`
  - `AssetPreview`
  - row filters
- Done: keep Edit thumbnail/audio preview separate from full Preview mode.
- Move project hub-specific behavior out of workspace components.
- Done: move workspace API orchestration into hooks.

### P1: Rebuild Preview Mode

- Done: rename the audio preview tab to `sounds` to match taxonomy scope.
- Done: derive preview tabs from the current matrix scopes.
- Replace the current stats/list preview with mode-oriented preview stages:
  - song select mock
  - osu!standard gameplay mock
  - osu!taiko gameplay mock
  - osu!catch gameplay mock
  - osu!mania gameplay mock
  - sounds playback rack
- The Preview page should answer: “Can I judge whether this asset set works in lazer?”

### P2: Classification and Domain Cleanup

- Split `classification-rules.ts` by scope:
  - std
  - taiko
  - catch
  - mania
  - interface
  - fonts/configs/sounds
  - stable/extras
- Keep `taxonomy.ts` as the display taxonomy source of truth.
- Add taxonomy path helpers to reduce stringly typed `scope/category/group` paths.
- Done: move duplicated domain policy into `skin-asset-policy.ts`:
  - meaning merge
  - kind priority
  - taxonomy sort
- Done: move identifier label formatting into `label.ts`.
- Done: API responses sanitize `root` and `fullPath` through `asset-dto`.
- Done: add `rule-catalog.ts` so classification rule ownership is explicit.

### P2: File Picker and Cross-platform UX

- Keep current `zenity/kdialog` picker for Linux local-first usage.
- Add browser upload/import fallback later:
  - `.osk` upload
  - extracted folder upload
  - directory picker where File System Access API is available
- Keep Nix as the only toolchain entrypoint for CLI/system dependencies.

### P2: Styling

- Do not migrate styling while behavior is still moving.
- After UI responsibilities are split, introduce Tailwind or component-scoped styles deliberately.
- Avoid leaving `styles.css` as an app-history dump.

## Test Plan

Run before merging implementation work:

```sh
nix develop -c bun test
nix develop -c bun run typecheck
nix develop -c bun run check
nix flake check
```

Regression tests to keep or add:

- `applause-s.*`, `applause-a.*`, `applause-d.*` classify as lazer meaningful sounds.
- `spinner-warning.png`, `spinner-circle.png`, `spinner-approachcircle.png` classify as taiko shaker.
- `taiko-slider.png` and `taiko-slider-fail.png` classify as taiko upper playfield.
- Main source is added as readonly asset source on import.
- Structured mirrors are generated and can be rebuilt.
- Source selector changes the right edit column.
- Export presets include/exclude expected files.

## Assumptions

- Current Next.js migration state is authoritative.
- `raw` is user-editable and authoritative.
- `structured` is generated and may be overwritten.
- Stable-only assets are preserved but not primary editor rows.
- The tool remains local-first; hosted/cloud workflows are out of scope for now.
