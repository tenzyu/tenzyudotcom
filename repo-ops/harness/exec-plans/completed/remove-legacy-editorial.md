---
title: Remove Legacy Editorial
description: Remove legacy editorial codebase.
---

# Remove Legacy Editorial

This plan covers the removal of legacy "Editorial" terminology and code paths that have been superseded by the "Editor" system.

## Task List

### 1. Code Cleanup

- [x] **Environment Variables (`src/config/env.contract.ts`)**
  - Remove fallbacks to `EDITORIAL_ADMIN_PASSWORD`, `EDITORIAL_SESSION_SECRET`, `EDITORIAL_STORAGE_DRIVER`, and `EDITORIAL_BLOB_PREFIX`.
- [x] **Session Handling (`src/features/admin/session.ts`)**
  - Remove `LEGACY_EDITORIAL_SESSION_COOKIE`.
  - Remove `editorial-admin` from `EditorSessionPayload['sub']`.
  - Cleanup `clearEditorAdminSession` and `hasEditorAdminSession` to only handle the new cookie.
- [x] **Scripts (`scripts/sync-storage.ts`)**
  - Update comments (change "Editorial" to "Editor").

### 2. Documentation Refactoring

- [x] **Rename Rule Files**
  - Rename `docs/design-docs/rules/editorial-role-separation.md` to `editor-role-separation.md`.
- [x] **Update Documentation Content**
  - Search and replace "Editorial" with "Editor" in `docs/` where it refers to the admin feature/system.
  - Update `docs/product-specs/site/architecture.md` (Header and content).
  - Update `docs/design-docs/AGENTS.md` (Table of contents and links).
- [x] **Update Project Memories**
  - Update `project_overview` memory.
  - Update `style_and_conventions` memory.

### 3. Verification

- [x] **Verify Build**
  - Run `bun run build` to ensure no broken imports.
- [x] **Verify Linting**
  - Run `bun run lint` to ensure consistency.

## Success Criteria

- No occurrences of `EDITORIAL_` environment variables in `src/`.
- `session.ts` no longer references the legacy editorial cookie.
- All documentation is consistent with the "Editor" naming convention.
- Project memories reflect the current ownership model accurately.
