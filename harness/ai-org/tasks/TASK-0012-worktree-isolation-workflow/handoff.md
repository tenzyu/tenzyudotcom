# Handoff: TASK-0012

## Task Summary

Added a canonical workflow for isolating non-trivial AI work in one branch, one worktree, and one AI session.

## What Changed

- Added `harness/ai-org/workflows/worktree-task-isolation.md`.
- Updated `harness/ai-org/workflows/task-intake.md` to require worktree isolation metadata and point mutable non-trivial work at the new workflow.
- Created task records for briefing, worklog, verification, and handoff.

## Why It Changed

The owner wants parallel AI work to use separate worktrees so review, merge, and revert stay isolated.

## Affected Files

- `harness/ai-org/workflows/worktree-task-isolation.md`
- `harness/ai-org/workflows/task-intake.md`
- `harness/ai-org/tasks/TASK-0012-worktree-isolation-workflow/*`

## Validation Result

`git diff --check` passed.

## Remaining Risks

- The workflow is documentation only until future tasks follow it in practice.
- External worktree paths still need per-machine selection.

## Follow-Up Tasks

- Apply this workflow to future non-trivial mutable tasks.
- Consider adding a short root-level pointer only if discoverability becomes an issue.

## Memory Updates Made Or Proposed

- Proposed durable memory: prefer `git worktree` over duplicate local clones for parallel same-repo AI work.
