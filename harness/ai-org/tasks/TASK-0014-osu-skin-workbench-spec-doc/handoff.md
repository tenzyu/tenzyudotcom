# Handoff: osu-skin-workbench spec document

## task summary

Created a durable product spec for `osu-skin-workbench` in an isolated worktree.

## what changed

- Added `docs/product-specs/osu-skin-workbench.md`.
- Added task records under `harness/ai-org/tasks/TASK-0014-osu-skin-workbench-spec-doc/`.
- Removed the accidentally-created untracked spec file from the main checkout after copying it into the worktree.

## why it changed

The owner asked to preserve the consolidated `osu-skin-workbench` specification while keeping confirmed facts separate from design candidates and unresolved decisions.

## affected files

- `docs/product-specs/osu-skin-workbench.md`
- `harness/ai-org/tasks/TASK-0014-osu-skin-workbench-spec-doc/brief.md`
- `harness/ai-org/tasks/TASK-0014-osu-skin-workbench-spec-doc/verification.md`
- `harness/ai-org/tasks/TASK-0014-osu-skin-workbench-spec-doc/handoff.md`

## validation result

- Main checkout status checked: only existing `opencode.json` modification remains.
- Isolated worktree status checked: intended docs/task files are untracked changes.
- Spec readback inspected.

## remaining risks

- The document intentionally includes owner-provided future direction. Future updates must keep these items labeled as candidates/open questions until implemented.

## follow-up tasks

- Review whether product specs should use a directory form such as `docs/product-specs/osu-skin-workbench/README.md` before merge.
- Optionally expand the spec into roadmap/security/architecture files later, following the Castalia pattern.

## memory updates made or proposed

No stable memory update proposed for this docs-only task.
