# Worktree Path Hardening

## background

The worktree isolation workflow allowed parent-sibling layouts such as `../.worktrees`. That caused drift across task records and made the worktree convention easy to miss.

## problem

Worktree instructions are not consistently using the same location rule.

## goal

Fix the harness docs so worktree isolation always uses `projectRoot/.worktrees/<task-slug>`.

## scope

- `harness/ai-org/workflows/worktree-task-isolation.md`
- `harness/ai-org/workflows/task-intake.md`
- `harness/ai-org/workflows/implementation.md`
- `harness/ai-org/skills/git.md`
- `.gitignore`
- `AGENTS.md`

## allowed files

The files listed in scope.

## forbidden files

Product runtime code.

## non-goals

- Migrating old task history
- Changing branch naming
- Changing Nx or Git behavior beyond the path rule

## constraints

- Keep canonical policy in `harness/ai-org`
- Avoid adding comments
- Preserve existing task history unless the current guidance must change

## role assignment

Harness Engineer

## worktree isolation

- Worktree path: `projectRoot/.worktrees/worktree-path-hardening`
- Branch: `ai/harness/worktree-path-hardening`
- Base branch: `develop`
- Owning AI session: current session
- Expected merge target: `develop`
- Cleanup expectation: remove worktree after review/merge or abandonment

## validation commands

- `git status --short`
- `git diff --check`

## acceptance criteria

- Workflow text requires `projectRoot/.worktrees/<task-slug>`
- No remaining canonical guidance tells agents to use `../.worktrees`
- Root guardrails reinforce the same rule

## risks

- Older task records may still show historical paths

## open questions

- None
