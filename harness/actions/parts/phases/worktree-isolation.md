# Phase: Worktree Isolation

Worktree isolation makes one task run in one branch, one working tree, and one AI session.

## When to use

Use this phase before non-trivial investigation, planning, implementation, review, or validation that may create file changes.

The stable unit of parallel AI work is:

```txt
1 run = 1 branch = 1 worktree = 1 AI session
```

## Default location

Use the repository root as `projectRoot`.

Always place worktrees under `projectRoot/.worktrees/` so search tools, watchers, Nx, TypeScript, editors, and linters do not scan sibling working trees.

Required pattern:

```txt
projectRoot/.worktrees/<task-slug>
```

Do not use `../.worktrees` or any parent-sibling worktree root.

## Branch naming

Use predictable AI task branches:

```txt
ai/<domain>/<task>
```

Examples:

```txt
ai/ui/storybook-normalize
ai/nix/flake-split
ai/castalia/prompt-loader
ai/checks/typecheck-harness
ai/harness/actions-restructure
```

## Setup procedure

From the main repository checkout:

```bash
git status --short
git branch --show-current
git pull --ff-only
git worktree add .worktrees/<task-slug> -b ai/<domain>/<task>
```

If `git pull --ff-only` is unsafe because the current tree has local changes, stop and ask the owner how to handle them.

After creating the worktree, continue the task from the new worktree path, not the original checkout.

## Existing branch procedure

If the branch already exists:

```bash
git worktree add .worktrees/<task-slug> ai/<domain>/<task>
```

Do not attach two active worktrees to the same branch.

## Required run records

In the run folder, record:

- branch name
- worktree path
- base branch or commit
- owning AI session or role
- expected merge target
- cleanup expectation

`brief.md` or `worklog.md` is enough for this metadata unless the run has a separate plan.

## Operating rules

- Do not run multiple unrelated AI tasks in the same working tree.
- Do not mix unrelated scopes in one task branch.
- Keep changes small enough to review, merge, or revert independently.
- Merge finished work from the main checkout after review and verification.
- Treat worktree deletion as cleanup only after useful changes are merged, abandoned, or otherwise preserved.
- Prefer worktree isolation over creating full local clones for normal same-repository parallel work.

## Merge and cleanup

From the main checkout after review:

```bash
git merge ai/<domain>/<task>
git worktree remove .worktrees/<task-slug>
git branch -d ai/<domain>/<task>
```

Use `git branch -D` only when deliberately abandoning an unmerged branch.

## When to use local clones instead

Use a separate local clone only when the task needs stronger isolation than a worktree provides, such as independent `node_modules`, build caches, hooks, `.env` files, or destructive long-running experiments.

Use a bare mirror plus clones only for many repeated clones or agent-farm style automation.

## Local ignore guidance

For local-only untracked files:

```txt
.git/info/exclude
```

For already-tracked files whose local changes must be hidden temporarily:

```bash
git update-index --skip-worktree <path>
```

Avoid `skip-worktree` except for narrow temporary local configuration because it is easy to forget and can hide important changes.
