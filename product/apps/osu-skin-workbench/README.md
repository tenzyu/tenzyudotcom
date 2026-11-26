# @tenzyu/osu-skin-workbench

This Tauri desktop app replaces the former Next.js `osu-skin-workbench` web app.

## What changed

- The app no longer uses the Next.js runtime or API routes.
- The Tauri WebView uses React and Vite for its UI.
- `@tenzyu/osu-skin-core` contains the reusable TypeScript domain, classification and matrix logic.
- Rust Tauri commands handle local project and file operations.

## Commands

```bash
bun run dev:tauri
bun run build:tauri
bun run build
```

Run these commands from the repository root:

```bash
bun run dev:skin-workbench
bun run build:skin-workbench
bun run verify:skin-workbench
```
