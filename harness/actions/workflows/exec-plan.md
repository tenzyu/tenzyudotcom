# Workflow: ExecPlan

An ExecPlan defines how a non-trivial task will be implemented before code
changes begin.

## Output

Create or update `plan.md` in the task folder.

## Required Sections

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

- Large rewrites require an ExecPlan.
- Implementation must stay inside the approved scope unless the plan is updated.
- Do not invent repository facts. Mark uncertain facts as `TODO` or `Assumption`.
- Use visible source, Nx project facts, package scripts, and existing docs as evidence.
