# Phase: Planning

Planning defines how a non-trivial run will be implemented before broad changes begin.

## Output

Create or update:

```txt
plan.md
```

Use `../artifacts/templates/plan.md` when creating a new plan.

## Required sections

- investigation summary
- current behavior
- target behavior
- role assignment and required knowledge loaded
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
- The plan must state which role owns the implementation and which role reviews it.
