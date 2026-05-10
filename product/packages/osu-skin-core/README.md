# @tenzyu/osu-skin-core

Reusable osu! skin domain logic extracted from the former Next.js `apps/osu-skin-workbench/src/lib` code.

This package intentionally keeps the original domain, classification, matrix, tree, and project-service logic as TypeScript assets. The Tauri desktop app imports classification/matrix logic on the frontend side. Native filesystem/project mutations are handled by Rust commands in `product/apps/osu-skin-workbench/src-tauri`.

## Included from the original code

- `src/lib/domain/*`
- `src/lib/classification/*`
- `src/lib/project/*`
- `src/lib/shared/*`
- `src/lib/server/{archive,fs-path,project-store,project-service}.ts`
- original Bun tests

## Removed from this package

- Next.js API route files
- `src/lib/server/http.ts`, because it depended on `next/server`
- `src/lib/client/project-api.ts`, because the Tauri app no longer calls HTTP API routes
