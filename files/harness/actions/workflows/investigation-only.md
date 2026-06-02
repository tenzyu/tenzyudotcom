# Workflow: Investigation Only

Use this workflow when the task is to understand a problem, produce findings, or prepare a later run without implementing changes.

## Required phases

- `../parts/phases/intake.md`
- `../parts/phases/investigation.md`
- `../parts/phases/handoff.md`

## Outputs

Write findings into a run folder when the investigation is non-trivial:

```txt
harness/runs/active/<RUN-ID>/brief.md
harness/runs/active/<RUN-ID>/worklog.md
harness/runs/active/<RUN-ID>/handoff.md
```

## Rules

- Do not implement unless the owner expands the scope.
- Separate facts from assumptions.
- Prefer exact source evidence over broad context loading.
- End with one of: proposed run, blocked, no action needed.
