# Phase: Implementation

Implementation makes the approved change inside scope.

## Output

- source or documentation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Rules

- Make small, reversible changes.
- Stay inside allowed files.
- Do not remove existing features unless explicitly approved.
- Do not silently change public APIs.
- Do not put app-specific logic inside shared packages.
- Do not perform unrelated refactors.
- Record follow-ups instead of broadening the run.
- If mutable work is happening, keep it inside `projectRoot/.worktrees/<task-slug>` as required by `worktree-isolation.md`.

## Quality gates

- Scope is respected.
- Existing behavior is preserved unless intentionally changed.
- Follow-up work is recorded instead of hidden in the diff.
