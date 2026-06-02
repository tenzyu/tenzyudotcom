# Phase: Planning

Planning defines how a non-trivial run will be implemented before broad changes begin.

This phase replaces the old `exec-plan` workflow when planning is only a lifecycle step.

## Output

Create or update:

```txt
plan.md
```

## Required sections

- investigation summary
- current behavior
- target behavior
- implementation strategy
- file-level impact
- dependency and boundary impact
- public API impact
- validation commands
- rollback considerations
- explicit non-goals

## Rules

- Large rewrites require a plan.
- Implementation must stay inside the approved scope unless the plan is updated.
- Mark uncertain facts as `TODO` or `Assumption`.
- Public API, package boundary, and migration risks must be explicit.
