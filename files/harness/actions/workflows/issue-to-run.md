# Workflow: Issue To Run

Convert an issue, request, or vague problem into a bounded executable run.

## Required phases

- `../parts/phases/intake.md`
- `../parts/phases/investigation.md`, when the scope cannot be bounded from the request
- `../parts/phases/planning.md`, when implementation strategy is needed before edits

## Inputs

- issue title and body, or human request
- labels, if present
- linked discussions or decisions
- relevant repository knowledge

## Outputs

Create or update:

```txt
harness/runs/active/<RUN-ID>/brief.md
harness/runs/active/<RUN-ID>/plan.md  # when non-trivial
```

## Ready standard

A run is ready only when scope, non-goals, validation, allowed files, forbidden files, constraints, risk, and completion criteria are clear.

Unclear requests are not implementation-ready.
