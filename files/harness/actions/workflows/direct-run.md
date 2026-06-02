# Workflow: Direct Run

Use this workflow for small scoped changes where full worktree isolation and planning would cost more than the change.

## Use when

- correcting a stale Markdown reference
- editing a narrow docs typo
- updating a small config note
- making a one-file harness clarification
- performing a mechanical change with low runtime risk

## Do not use when

- source code runtime behavior changes
- package dependencies change
- public APIs change
- security, auth, release, or deployment behavior changes
- the task has uncertain scope
- the change touches multiple unrelated concerns

## Required steps

1. State the scope.
2. Identify the file or small file set.
3. Make the edit.
4. Run the narrowest relevant validation.
5. Record handoff when future work would benefit.

## Required evidence

At minimum, record:

- files changed
- validation run or skipped-check justification
- remaining risk, if any

For changes that create a run record, use:

- `../parts/artifacts/templates/verification.md`
- `../parts/artifacts/templates/handoff.md`
