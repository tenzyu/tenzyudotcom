# Phase: Knowledge Promotion

Knowledge promotion preserves durable knowledge after a run.

## Output

Update files under `harness/knowledge/` only when the knowledge is durable.

## Promote knowledge when it is

- likely to recur
- useful across future tasks
- not obvious from source code
- verified or tied to a concrete run
- relevant to boundaries, workflows, pitfalls, or decisions
- likely to improve role-based context routing

## Do not store

- raw command noise
- every intermediate thought
- duplicate snippets
- stale implementation details
- one-off preferences without future utility
- unverified guesses

## Common destinations

- `harness/knowledge/index.md` routes agents to the right file.
- `harness/knowledge/repo-map.md` stores stable repository ownership and structure.
- `harness/knowledge/known-problems/` stores recurring environment or workflow problems.
- `harness/knowledge/decisions/` stores durable design decisions.
- `harness/knowledge/decisions/adr/` stores formal ADRs.
- `harness/knowledge/lessons/` stores repeated mistakes or failed approaches worth avoiding.
- `harness/knowledge/component-notes/` stores stable component-specific notes.
- `harness/knowledge/incidents/` stores production, CI, release, or tooling incidents.
- role files under `harness/actions/roles/` may be updated when routing rules change.

## Rule

Observation does not automatically become knowledge.
