# TASK-0012: Standardize Worktree Task Isolation

## Background

The owner wants parallel AI work to avoid sharing one working tree because mixed scopes make review, merge, and revert unsafe.

## Problem

The harness did not have a dedicated workflow that tells agents to create a branch and worktree per task before mutable or parallel work.

## Goal

Add a canonical workflow that makes `git worktree` the default isolation mechanism for non-trivial task work.

## Scope

- Add a worktree task isolation workflow under `harness/actions/workflows`.
- Link task intake to the new workflow where useful.
- Record task verification and handoff.

## Allowed Files

- `harness/actions/workflows/worktree-task-isolation.md`
- `harness/actions/workflows/task-intake.md`
- `harness/runs/completed/TASK-0012-worktree-isolation-workflow*`

## Forbidden Files

- Product source files.
- Root AI adapter files unless explicitly needed.

## Non-Goals

- Do not create actual persistent worktrees for this documentation-only change.
- Do not alter Git hooks or repository ignore rules.
- Do not mandate full local clones as the default.

## Constraints

- Keep the workflow practical and concise.
- Prefer repo-external worktree paths.
- Preserve local-only ignore guidance using `.git/info/exclude`.

## Role Assignment

Harness Engineer.

## Worktree Isolation

This task updates the worktree isolation standard itself. The resulting workflow requires future non-trivial mutable tasks to use one branch, one worktree, and one AI session.

## Validation Commands

- `git diff --check`

## Acceptance Criteria

- A dedicated worktree workflow exists.
- The workflow states `1 task = 1 branch = 1 worktree = 1 AI session`.
- The workflow recommends repo-external worktree locations.
- The workflow documents branch naming, setup, merge, cleanup, local clone exceptions, and local ignore guidance.
- Task intake references the workflow for non-trivial mutable work.

## Risks

- Agents may over-apply worktrees to trivial documentation changes.
- External paths vary by developer machine, so the workflow must provide patterns rather than one hard-coded path.

## Open Questions

None.
