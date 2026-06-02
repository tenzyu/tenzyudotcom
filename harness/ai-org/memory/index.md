# Memory Index

Use this file to route agents to the right durable memory. Do not turn it into a
general log.

## Core Memory

- `repo-map.md`: stable repository areas, ownership, and package responsibilities.
- `known-problems.md`: recurring workflow, tooling, or environment problems.
- `decisions/`: durable design decisions and formal ADRs.
- `decisions/adr/`: accepted architecture decision records.
- `lessons/`: repeated mistakes or failed paths worth avoiding.
- `component-notes/`: stable notes for shared UI components.
- `incidents/`: production, CI, or release incidents worth preserving.

## LLM-Facing Knowledge Roots

- `../knowledge/design-docs/`: architecture rules and repair references.
- `../exec-plans/`: active and completed execution plans.
- `../references/`: external workflow and verification references.
- `../reports/`: AI audits and investigation reports.
- `../skills/`: tool guardrails for Git, Nx, and repository linters.

## Memory Rules

- Store only durable, recurring, verified knowledge.
- Keep task-specific detail under `tasks/TASK-*/`.
- Prefer links to source files, docs, or task artifacts over copied content.
