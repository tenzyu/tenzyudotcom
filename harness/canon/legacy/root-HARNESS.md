# HARNESS.md

`harness/ai-org` is the canonical operating system for AI-assisted work in this repository.

## Start

1. Read `AGENTS.md`.
2. Read `harness/ai-org/README.md`.
3. Pick the smallest role from `harness/ai-org/agents/`.
4. Follow the current phase workflow from `harness/ai-org/workflows/`.
5. For non-trivial work, create `harness/ai-org/tasks/TASK-XXXX-*/`.
6. Before claiming completion, write `verification.md` and `handoff.md`.

## What Lives Where

| Path | Purpose |
| --- | --- |
| `harness/ai-org/agents/` | Role boundaries for task intake, implementation, review, docs, and repo operations |
| `harness/ai-org/workflows/` | Canonical task procedures |
| `harness/ai-org/skills/` | Tool-triggered guardrails for Git, Nx, and repo linters |
| `harness/ai-org/memory/` | Durable memory, decisions, ADRs, lessons, and repo map |
| `harness/ai-org/knowledge/` | LLM-facing architecture rules and references |
| `harness/ai-org/exec-plans/` | Active/completed execution plans and tech-debt planning |
| `harness/ai-org/references/` | External workflow and verification references |
| `harness/ai-org/reports/` | AI audits and generated investigation reports |
| `harness/ai-org/tasks/` | Concrete task artifacts |
| `docs/` | Human-facing repository and product documentation |

## Default Flow

```txt
Task intake -> Investigation -> Plan -> Implementation -> Verification -> Review -> Handoff -> Memory update
```

Use `harness/ai-org/workflows/task-lifecycle.md` as the top-level checklist.

## Required Task Files

For non-trivial work:

- `brief.md`
- `worklog.md`
- `plan.md` when the change is broad or risky
- `verification.md`
- `review.md` when independent review is required
- `handoff.md`

## Agent Roles

Use these common roles first:

- `task-intake-agent.md`: turn a user request into a bounded task.
- `work-agent.md`: investigate, plan, and implement within scope.
- `review-agent.md`: independently check requirements, risks, and verification.
- `adr-distiller.md`: convert decisions into durable ADR/memory records.

Specialized roles remain available for product, design system, repo ops, and harness work.

## Tool Guardrails

Before using these tools, read the matching skill:

- Git: `harness/ai-org/skills/git.md`
- Nx: `harness/ai-org/skills/nx.md`
- Custom linter: `harness/ai-org/skills/tenzyu-linter.md`

## ADRs

Formal ADRs live in `harness/ai-org/memory/decisions/adr/`. If a task requires a material architecture decision, interview the owner before recording the ADR.
