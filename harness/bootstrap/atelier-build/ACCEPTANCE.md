# ACCEPTANCE.md

## Bootstrap harness acceptance

Completion of the bootstrap harness setup is allowed only when every box below is checked:

- [x] `AGENTS.md` exists and routes Atelier-related work to `harness/bootstrap/atelier-build`.
- [x] `harness/bootstrap/atelier-build/CONTRACT.md` exists.
- [x] `harness/bootstrap/atelier-build/ALLOWED_PATHS.txt` exists.
- [x] `harness/bootstrap/atelier-build/FORBIDDEN_PATHS.txt` exists.
- [x] `harness/bootstrap/atelier-build/GENERATED_PATHS.txt` exists.
- [x] `harness/bootstrap/atelier-build/REVIEW_LEDGER.md` exists.
- [x] `harness/bootstrap/atelier-build/ACCEPTANCE.md` exists.
- [x] `harness/bootstrap/atelier-build/NEXT_ACTION.md` exists and contains exactly one next task.

## Per-task acceptance

For every task executed under this harness, completion is forbidden while any of the following is true:

- `REVIEW_LEDGER.md` has an open issue blocking the current task.
- A path listed in `GENERATED_PATHS.txt` was directly edited by hand.
- A path listed in `FORBIDDEN_PATHS.txt` was edited without an explicit expansion in `NEXT_ACTION.md`.
- The acceptance conditions declared in `NEXT_ACTION.md` for the current task are not satisfied.

## Reporting

If any condition above cannot be satisfied, the agent must report it explicitly in the final report rather than declaring completion.
