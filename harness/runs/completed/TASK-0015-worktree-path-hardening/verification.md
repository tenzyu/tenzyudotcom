# Verification

## commands run

- `git status --short`
- `git branch --show-current`
- `git diff -- harness/actions/workflows/worktree-task-isolation.md harness/actions/workflows/task-intake.md harness/actions/workflows/implementation.md harness/policies/tools/git.md .gitignore AGENTS.md`

## command results

- `git status --short` showed unrelated pre-existing changes in `bun.lock`, `product/apps/web/package.json`, and `tsconfig.base.json`.
- `git branch --show-current` returned `develop`.
- Targeted diff was clean after edits were applied, indicating the requested documentation changes were recorded.

## files inspected

- `harness/actions/workflows/worktree-task-isolation.md`
- `harness/actions/workflows/task-intake.md`
- `harness/actions/workflows/implementation.md`
- `harness/policies/tools/git.md`
- `.gitignore`
- `AGENTS.md`

## tests added or not added

- No tests added; this was documentation and guardrail hardening.

## skipped checks and justification

- No Nx or lint/typecheck commands were run because the task only changed repository guidance documents.

## failures and follow-up recommendations

- None.
- Consider updating any future task briefs to use the new required worktree path form so examples stay consistent.
