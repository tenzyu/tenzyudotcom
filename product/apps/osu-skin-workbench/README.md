# @tenzyu/osu-skin-workbench

Tauri-only desktop migration of the former Next.js/Web `osu-skin-workbench`.

## What changed

- Removed Next.js runtime and API routes.
- Kept React/Vite only as the Tauri WebView UI layer.
- Moved reusable TypeScript domain/classification/matrix logic into `@tenzyu/osu-skin-core`.
- Replaced local project/file operations with Rust Tauri commands.

## Commands

```bash
bun run dev:tauri
bun run build:tauri
bun run build
```

From repository root:

```bash
bun run dev:skin-workbench
bun run build:skin-workbench
bun run verify:skin-workbench
```
