# NEXT_ACTION.md

## One next task

Run the existing readiness command and capture its machine-readable output:

```bash
bun nx run @atelier/implementation-control:ready
```

Fallback if the Nx target is unavailable:

```bash
bun run --cwd harness/knowledge/implementation-control/atelier ready
```

## Allowed surface for this task

- Read-only access to:
  - `harness/knowledge/implementation-control/atelier/**`
  - `harness/knowledge/product-specs/atelier/**`
- Write access only to:
  - `harness/bootstrap/atelier-build/REVIEW_LEDGER.md` (to record any new blockers as issues)
  - `harness/bootstrap/atelier-build/NEXT_ACTION.md` (to replace this task with the next single task after the readiness report has been read)

## Forbidden for this task

- Do not edit any file under `harness/knowledge/implementation-control/atelier/**`.
- Do not edit any file under `harness/knowledge/product-specs/atelier/**` or `product-specs/atelier/**`.
- Do not edit any path listed in `GENERATED_PATHS.txt`.
- Do not advance any DAG node.
- Do not implement compiler logic, schemas, validators, or views as part of this task.

## Acceptance for this task

- The readiness command was executed, or its unavailability was reported explicitly.
- Every blocker reported by the readiness command is either:
  - already represented as an open issue in `REVIEW_LEDGER.md`, or
  - newly recorded as an open issue in `REVIEW_LEDGER.md` using the defined issue format.
- `NEXT_ACTION.md` is then replaced with exactly one next single task that addresses the highest-priority open issue via a mechanism change (parser, compiler rule, schema, generator, readiness predicate, fixture, validation command, agent instruction, or acceptance condition).
