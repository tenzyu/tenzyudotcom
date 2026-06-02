# Skill: Git Guardrails

Read this before using Git for repository work.

## Triggers

Use when running `git status`, `git diff`, `git worktree`, `git add`, `git commit`, `git merge`, `git pull`, `git push`, or branch commands.

## Rules

- Check `git status --short` before mutable work.
- For non-trivial tasks, use one branch and one worktree per task.
- Prefer branch names like `ai/<domain>/<task>`.
- Do not commit, amend, push, force-push, or create PRs unless the owner explicitly asks.
- Before committing, inspect status, diff, and recent log.
- Stage only intended files.
- Never commit secrets.
- Do not hide tracked changes with `skip-worktree` except for narrow temporary local config.
- Use `projectRoot/.worktrees/<task-slug>` for worktree paths; do not use `../.worktrees`.

## Standard Checks

```bash
git status --short
git branch --show-current
git diff --check
```

## Worktree Reference

Follow `harness/ai-org/workflows/worktree-task-isolation.md` for setup, merge, and cleanup.
