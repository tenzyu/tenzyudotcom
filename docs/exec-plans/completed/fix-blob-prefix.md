---
title: Fix Blob Prefix
description: fix blob prefix such as 'editor' and 'blog'
---

# Current Problem

notes や recommends は Vercel の Blob で `/editor/*.json` があるからいいが、blog のコンテンツは `/blog/*.mdx` で存在する。今は環境変数に `EDITOR_BLOB_PREFIX=editor` が存在するが、これを参照しないようにする。ローカルのものは `storage/{editor,blog}/` に存在するように、Vercel のものは `<vercel-blob>/{editor,blog}` として解釈する。

## Task List

- [ ] **Research and Planning**
  - [x] Identify all usages of `EDITOR_BLOB_PREFIX` and hardcoded `storage/editor` or `storage/blog` paths.
- [x] **Environment Configuration**
  - [x] Remove `editorBlobPrefix` from `src/config/env.contract.ts`.
  - [x] Remove `EDITOR_BLOB_PREFIX` from `.env-sample`.
- [x] **Storage Logic Refactoring**
  - [x] Update `src/lib/editor/editor.contract.ts`:
    - [x] Update `EDITOR_COLLECTIONS` to include the full relative path (e.g., `editor/recommendations.json`) in `storagePath`.
    - [x] Update `getBlobPath` to use `descriptor.storagePath` directly.
    - [x] Update `getLocalPath` to use a base `storage` directory and `descriptor.storagePath`.
    - [x] Ensure `saveBlogPost` uses consistent path logic.
  - [x] Refactor common types and descriptors to `src/lib/editor/editor.collections.ts` to avoid circular dependencies.
  - [x] Decompose `editor.collections.ts` into granular layers according to `AGENTS.md`:
    - [x] `src/lib/editor/editor.domain.ts` for pure types.
    - [x] `src/lib/editor/editor.port.ts` for interfaces and descriptor types.
    - [x] Moved `*_COLLECTION_DESCRIPTOR` to respective feature contract files (Ownership Model).
    - [x] Created `src/app/[locale]/(admin)/editor/_features/editor.collections.ts` as a registry for Admin UI.
  - [x] Update `src/app/[locale]/(main)/blog/_features/blog.assemble.ts` and `src/app/[locale]/(admin)/editor/_features/dashboard.tsx` to use the new centralized configuration.
  - [x] Pass `env.blobReadWriteToken` explicitly to `@vercel/blob` calls for better build reliability.
- [x] **Verification**
  - [x] **Verify Build**
    - Run `bun run build` to ensure no broken imports.
  - [x] **Verify Linting**
    - Run `bun run lint` to ensure consistency.
  - [x] **Verify Editor**
    - Check if notes, recommendations, etc., can still be loaded and saved.
    - Check if blog posts can still be loaded and saved.

## Success Criteria

- Vercel 上でのビルドに成功する。