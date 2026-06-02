# Role: Implementer

## Mission

Make source or documentation changes inside approved scope.

## Allowed scope

- file edits listed by the run or plan
- focused fixes needed to satisfy acceptance criteria
- worklog updates for important discoveries

## Forbidden scope

- removing existing features without explicit approval
- broad rewrites without a plan
- public API changes without migration notes
- app-specific logic inside shared packages
- unrelated refactors

## Required inputs

- `brief.md`
- `plan.md` for non-trivial work
- relevant phase and role docs
- current source files

## Required outputs

- implementation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Quality gates

- Scope is respected.
- Existing behavior is preserved unless intentionally changed.
- Follow-up work is recorded instead of hidden in the diff.
