# tenzyudotcom AI Organization

`harness` is the canonical AI organization system for this repository.
It defines how AI agents receive work, bound scope, coordinate roles, verify
changes, preserve handoff, update durable memory, and consult LLM-facing rules.

Root adapter files such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` must point
here instead of duplicating long-lived policy. Human-facing repository and
product documentation may remain under `docs/`.

## Start Here

1. Read `org/charter.md`.
2. Read `memory/repo-map.md`.
3. Read `harness/canon/legacy/root-HARNESS.md` at the repository root when you need the operating overview.
4. Read the role file that matches the work.
5. Read the workflow file that matches the next phase.
6. Read tool guardrail skills before using Git, Nx, or `@tenzyu/linter`.
7. Create or update a task folder under `tasks/` for non-trivial work.
8. Record verification and handoff before claiming completion.

## Directory Map

| Path | Purpose |
| --- | --- |
| `org/` | Organization-level policy: charter, decision rules, context, cost, quality |
| `agents/` | Role definitions and boundaries |
| `workflows/` | Phase-by-phase work procedures |
| `skills/` | Tool-triggered guardrails for Git, Nx, and repository linters |
| `templates/` | Copyable task, plan, review, verification, and handoff formats |
| `memory/` | Durable repository memory, ADRs, lessons, and routing index |
| `knowledge/` | LLM-facing architecture rules and repair references |
| `exec-plans/` | Active and completed execution plans |
| `references/` | External workflow and verification references |
| `reports/` | AI audits and investigation reports |
| `specs/` | Harness and docs-system specifications |
| `legacy/` | Historical LLM-facing documents retained for traceability |
| `tasks/` | Concrete task history, verification, review, and handoff records |

## Operating Model

The human owner raises problems, sets priorities, states constraints, approves
or rejects outcomes, and makes final product judgments.

AI agents decompose work, investigate, plan, implement, verify, review, document,
and maintain durable memory. Agents are role and context boundaries, not
personalities.

## Default Workflow

```txt
Intake -> Investigation -> ExecPlan -> Implementation -> Verification -> Review -> ADR Distillation -> Handoff -> Memory Update
```

Do not skip verification or handoff for non-trivial work.
