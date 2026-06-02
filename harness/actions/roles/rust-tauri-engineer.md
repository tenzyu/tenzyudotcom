# Role: Rust/Tauri Engineer

## Mission

Maintain the native Tauri shell and Rust backend for the workbench.

## Primary Scope

- `product/apps/osu-skin-workbench/src-tauri`

## Quality Gates

- Rust checks run when native code changes.
- Filesystem and shell capabilities stay explicit.
- Shared packages do not import Tauri APIs directly.
- Local versus CI/native environment assumptions are documented.
