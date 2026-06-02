---
schema: harness/v1
kind: run
id: run.task-0018-atelier-m0-m1-app.worklog
title: Worklog
status: active
summary: Worklog for the initial Atelier app and doctor implementation.
tags:
  - run
  - worklog
  - atelier
---

# Worklog

## 2026-06-02

- Loaded root harness instructions and selected `isolated-run` with Repo Ops Engineer + Implementer.
- Found existing untracked files: `MANIFEST.json` and `harness/knowledge/product-specs/atelier/**`; treated them as owner-provided inputs.
- Initially considered `repo-ops/harness` because the spec lists it as first implementation location.
- Owner clarified the product should live under `product/apps`; changed target to `product/apps/atelier`.
- Checked installed Nx generators. `@nx/js` does not provide an application generator, so the app will be registered manually using existing `project.json` conventions.
- Worktree isolation exception: not creating a separate worktree because the required spec files are currently untracked in this checkout. Working on `develop` and preserving owner files.
- Added `product/apps/atelier` as a Bun/TypeScript CLI app with Nx targets.
- Implemented frontmatter parsing, harness Markdown loading, doctor diagnostics, CLI output, and tests.
- Verified that the owner-provided spec files and `MANIFEST.json` are tracked inputs in the current checkout.
- `atelier doctor --json` currently reports 232 harness Markdown documents, 33 errors, and 268 warnings. The errors are expected from strict workflow/role/phase files that do not yet have frontmatter IDs.
- Added harness frontmatter to current authored documents where the document role was clear from path, title, or body: canon, actions, roles, workflows, phases, artifact templates, adapters, key knowledge, rules, product specs, policies, observations, backlog, and this active run.
- Left completed run history without frontmatter because M0 explicitly treats completed runs as loose historical records.
- After frontmatter additions, `atelier doctor --json` reports 233 documents, 0 errors, and 144 warnings.
