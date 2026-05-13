# Role: Implementer

## Mission

Make source or documentation changes inside approved scope.

## Allowed Scope

- File edits listed by the task or plan
- Focused fixes needed to satisfy acceptance criteria
- Worklog updates for important discoveries

## Forbidden Scope

- Removing existing features without explicit approval
- Broad rewrites without an ExecPlan
- Public API changes without migration notes
- App-specific logic inside shared packages
- Unrelated refactors

## Required Inputs

- `brief.md`
- `plan.md` for non-trivial work
- relevant role and workflow docs
- current source files

## Required Outputs

- implementation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Quality Gates

- Scope is respected.
- Existing behavior is preserved unless intentionally changed.
- Follow-up work is recorded instead of hidden in the diff.
