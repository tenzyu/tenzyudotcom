# Knowledge Index

Use this file to route agents to durable knowledge. Do not turn it into a general log.

Role files under `harness/actions/roles/` are the first context routing layer. Load role-required knowledge before broad search.

## Core knowledge

- `repo-map.md`: stable repository areas, ownership, and package responsibilities.
- `known-problems/`: recurring workflow, tooling, or environment problems.
- `decisions/`: durable design decisions and formal ADRs.
- `decisions/adr/`: accepted architecture decision records.
- `lessons/`: repeated mistakes or failed paths worth avoiding.
- `component-notes/`: stable notes for shared UI components.
- `incidents/`: production, CI, or release incidents worth preserving.

## LLM-facing knowledge roots

- `rules/`: architecture, implementation, security, reliability, UI, and product rules.
- `rule-references/`: repair guides that route lint or policy findings to specific rules.
- `product-specs/`: product-specific specs and guardrails.
- `references/`: supporting workflow and verification references.
- `specs/`: specs for harness tooling or generated documentation.
- `monorepo/`: workspace and Nx-specific knowledge.

## Routing order

1. Choose workflow.
2. Assign roles.
3. Load required knowledge listed by assigned roles.
4. Load optional knowledge only when the trigger matches.
5. Search source files only after identifying the affected area.
6. Load completed run history only when diagnosing repeated work or preserving migration context.

## Knowledge rules

- Store only durable, recurring, verified knowledge.
- Keep run-specific detail under `harness/runs/`.
- Prefer links to source files, docs, or run artifacts over copied content.
- Promote observation to knowledge only through `harness/actions/phases/knowledge-promotion.md`.
