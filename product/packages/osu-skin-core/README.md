# @tenzyu/osu-skin-core

This package contains reusable osu! skin domain logic from the former Next.js `apps/osu-skin-workbench/src/lib` code.

The package retains the original domain, classification, matrix, tree, and project-service logic in TypeScript. The Tauri desktop frontend imports the classification and matrix logic. Rust commands in `product/apps/osu-skin-workbench/src-tauri` handle native filesystem and project mutations.

## Retained source files

- `src/lib/domain/*`
- `src/lib/classification/*`
- `src/lib/project/*`
- `src/lib/shared/*`
- `src/lib/server/{archive,fs-path,project-store,project-service}.ts`
- Original Bun tests

## Removed source files

- Next.js API route files
- `src/lib/server/http.ts`, because it depended on `next/server`
- `src/lib/client/project-api.ts`, because the Tauri app no longer calls HTTP API routes
