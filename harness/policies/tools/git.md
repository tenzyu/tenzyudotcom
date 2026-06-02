# Skill: Git Guardrails

Read this before using Git for repository work.

## Triggers

Use when running `git status`, `git diff`, `git worktree`, `git add`, `git commit`, `git merge`, `git pull`, `git push`, or branch commands.

## Rules

- Check `git status --short` before mutable work.
- For non-trivial runs, use one branch and one worktree per run.
- Prefer branch names like `ai/<domain>/<task>`.
- Do not commit, amend, push, force-push, or create PRs unless the owner explicitly asks.
- Before committing, inspect status, diff, and recent log.
- Stage only intended files.
- Never commit secrets.
- Do not hide tracked changes with `skip-worktree` except for narrow temporary local config.
- Use `projectRoot/.worktrees/<task-slug>` for worktree paths; do not use `../.worktrees`.

## Standard checks

```bash
git status --short
git branch --show-current
git diff --check
```

## Worktree reference

Follow `harness/actions/phases/worktree-isolation.md` for setup, merge, and cleanup.
