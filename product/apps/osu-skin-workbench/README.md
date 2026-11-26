# @tenzyu/osu-skin-workbench

This Tauri desktop app replaces the former Next.js `osu-skin-workbench` web app.

## Runtime and package boundaries

- The app uses neither the Next.js runtime nor its API routes.
- The Tauri WebView uses React and Vite for its UI.
- `@tenzyu/osu-skin-core` contains the reusable TypeScript domain, classification and matrix logic.
- Rust Tauri commands handle local project and file operations.

## Development and build commands

```bash
bun run dev:tauri
bun run build:tauri
bun run build
```

The repository root provides equivalent workspace commands and a verification command:

```bash
bun run dev:skin-workbench
bun run build:skin-workbench
bun run verify:skin-workbench
```
