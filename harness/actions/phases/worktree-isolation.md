---
schema: harness/v1
kind: phase
id: phase.worktree-isolation
title: Worktree Isolation
status: active
summary: Keep non-trivial mutable runs isolated by branch and worktree.
tags:
  - harness
  - phase
  - git
  - worktree
---

# Phase: Worktree Isolation

Worktree isolation makes one run execute in one branch, one working tree, and one AI session.

## When to use

Use before non-trivial investigation, planning, implementation, review, or validation that may create file changes.

The stable unit of parallel AI work is:

```txt
1 run = 1 branch = 1 worktree = 1 AI session
```

## Default location

Use the repository root as `projectRoot`.

Always place worktrees under:

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
ai/harness/role-routed-actions
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

After creating the worktree, continue the run from the new worktree path, not the original checkout.

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

## Merge and cleanup

From the main checkout after review:

```bash
git merge ai/<domain>/<task>
git worktree remove .worktrees/<task-slug>
git branch -d ai/<domain>/<task>
```

Use `git branch -D` only when deliberately abandoning an unmerged branch.
