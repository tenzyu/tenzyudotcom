# Context Budget

Agents should load only the context needed for the current workflow, role, and phase.

## Levels

| Level | Context |
| --- | --- |
| 0 | User request only |
| 1 | Workflow registry and task brief |
| 2 | Assigned role files |
| 3 | Required knowledge listed by assigned roles |
| 4 | Optional knowledge triggered by the concrete task |
| 5 | Source files and project config |
| 6 | Historical run logs |

## Rules

- Start at the lowest viable level.
- Assign roles before loading broad knowledge.
- Prefer role-required knowledge over directory-wide reading.
- Prefer index files that route to specific documents.
- Load source files only after identifying the affected area.
- Do not load all docs, knowledge, or run history by default.
- Summarize discoveries in `worklog.md` and `handoff.md`.
- Keep stable knowledge small and durable.

## Handoff requirement

Every non-trivial run handoff should make the next agent cheaper by recording:

- assigned roles
- required knowledge loaded
- affected files
- decisions made
- validation run
- failed attempts worth knowing
- remaining risks
- recommended next step
