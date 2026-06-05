Use this file as the goal objective when running the OpenCode goal plugin.

# GOAL: Operational Atelier v0

P0/P1 defects in this file must be fixed before operational pass.

## Mission

Move the current artifact from:

```txt
Atelier v0 Bootstrap Skeleton
```

to:

```txt
Operational Atelier v0
```

Do this through `atelier-coordinator`, which dispatches `atelier-implementer` and `atelier-reviewer` subagents.

## Latest review

Authoritative review file:

@harness/atelier-design-docs/REVIEW-LATEST.md

P0/P1 defects in this file must be fixed before operational pass.

# Contracts

## Required operational behavior

The system must demonstrate:

1. `.atelier-bootstrap/**` is tooling only;
2. `.atelier/v0/**` is generated output/state;
3. object graph storage uses NDJSON;
4. `canonical/**` is not the primary architecture;
5. implementation-control is not the root concept;
6. indexer supports strict full validation and affected propagation;
7. reader creates non-empty task-scoped attention for a real task;
8. reader deep-read produces KnowledgeObject / SemanticClaim from selected attention only;
9. transformer produces md-to-code task and test contract from `harness/atelier-design-docs`, not a toy sample only;
10. executor creates packet context and validates handoff/evidence;
11. EvidenceRecord `passed` status requires runtime proof;
12. duplicate/conflicting packet lifecycle state fails readiness;
13. `bun run atelier:ready` fails closed;
14. `bun run atelier:verify` checks whole-system behavior;
15. reviewer can distinguish scaffold pass from operational pass.

## Required command surface

Equivalent names are allowed only if documented and reviewer-approved.

```bash
bun run atelier:index
bun run atelier:affected
bun run atelier:index:render
bun run atelier:index:validate

bun run atelier:sample
bun run atelier:attention -- --task "<task>"
bun run atelier:deep-read -- --attention <id>
bun run atelier:reader:validate

bun run atelier:transform:md-to-code
bun run atelier:transform:validate
bun run atelier:transform:render

bun run atelier:packet:create
bun run atelier:packet:context
bun run atelier:packet:complete
bun run atelier:evidence:add
bun run atelier:executor:validate

bun run atelier:ready
bun run atelier:verify
bun run atelier:render
```

## Parallelism policy

The coordinator should actively dispatch multiple implementer subagents when edit boundaries do not overlap.

Safe workstreams:

```txt
indexer
reader
transformer
executor
operation
```

Serialize if dependencies or file write boundaries are unclear.

## Completion policy

The goal is complete only when `atelier-reviewer` returns `status: pass` and `atelier:ready` / `atelier:verify` genuinely pass.

If work remains, do not emit a goal marker. Let the plugin continue.

## Important goal-plugin constraint

The OpenCode goal plugin is marker-based. It auto-continues while the session is idle and stops only when the coordinator's final response line is one of:

```txt
[goal:complete]
[goal:blocked]
```

Therefore:

- implementer subagents must never emit goal markers;
- reviewer subagents must never emit goal markers;
- only `atelier-coordinator` may emit final markers;
- the coordinator must not emit `[goal:complete]` until reviewer pass and real validation;
- the coordinator must not emit `[goal:blocked]` unless user/product-author input or tooling availability is required.
