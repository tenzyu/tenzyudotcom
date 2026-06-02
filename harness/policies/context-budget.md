# Context Budget

Agents should load only the context needed for the current phase.

## Levels

| Level | Context |
| --- | --- |
| 0 | User request only |
| 1 | Task brief and repo map |
| 2 | Relevant workflow and role |
| 3 | Related ADRs, lessons, or component notes |
| 4 | Source files and project config |
| 5 | Historical task logs |

## Rules

- Start at the lowest viable level.
- Prefer index files that route to specific documents.
- Load source files only after identifying the affected area.
- Do not load all docs, memory, or task history by default.
- Summarize discoveries in `worklog.md` and `handoff.md`.
- Keep stable memory small and durable.

## Handoff Requirement

Every non-trivial task handoff should make the next agent cheaper by recording:

- affected files
- decisions made
- validation run
- failed attempts worth knowing
- remaining risks
- recommended next step
