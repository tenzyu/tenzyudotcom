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
- [x] **Verification**
  - [x] **Verify Build**
    - Run `bun run build` to ensure no broken imports.
  - [x] **Verify Linting**
    - Run `bun run lint` to ensure consistency.
  - [x] **Verify Editor**
    - Check if notes, recommendations, etc., can still be loaded and saved.
    - Check if blog posts can still be loaded and saved.

## Success Criteria
