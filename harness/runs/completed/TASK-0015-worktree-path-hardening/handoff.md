# Handoff

## task summary

Standardized the harness worktree rule so mutable task work must use `projectRoot/.worktrees/<task-slug>`.

## what changed

- Removed the fallback guidance that allowed `../.worktrees`.
- Added the required path rule to the worktree workflow.
- Reinforced the same rule in task intake, implementation, git guardrails, root `.gitignore`, and root `AGENTS.md`.

## why it changed

The previous wording left room for inconsistent parent-sibling worktree layouts, which made the worktree convention easy to miss.

## affected files

- `harness/actions/workflows/worktree-task-isolation.md`
- `harness/actions/workflows/task-intake.md`
- `harness/actions/workflows/implementation.md`
- `harness/policies/tools/git.md`
- `.gitignore`
- `AGENTS.md`

## validation result

- `git status --short` showed unrelated pre-existing changes in `bun.lock`, `product/apps/web/package.json`, and `tsconfig.base.json`.
- Targeted diff for the edited guidance files was clean after applying the changes.

## remaining risks

- Older task artifacts may still contain historical worktree paths.

## follow-up tasks

- Update any future task examples to use the new required `projectRoot/.worktrees/<task-slug>` form.

## memory updates made or proposed

- Proposed durable memory: worktree isolation for this repo should always use `projectRoot/.worktrees/<task-slug>`.
