# tenzyudotcom AI Organization

`harness/ai-org` is the canonical AI organization system for this repository.
It defines how AI agents receive work, bound scope, coordinate roles, verify
changes, preserve handoff, and update durable memory.

Root adapter files such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` must point
here instead of duplicating long-lived policy.

## Start Here

1. Read `org/charter.md`.
2. Read `memory/repo-map.md`.
3. Read the role file that matches the work.
4. Read the workflow file that matches the next phase.
5. Create or update a task folder under `tasks/` for non-trivial work.
6. Record verification and handoff before claiming completion.

## Directory Map

| Path | Purpose |
| --- | --- |
| `org/` | Organization-level policy: charter, decision rules, context, cost, quality |
| `agents/` | Role definitions and boundaries |
| `workflows/` | Phase-by-phase work procedures |
| `templates/` | Copyable task, plan, review, verification, and handoff formats |
| `memory/` | Durable repository memory and routing index |
| `tasks/` | Concrete task history, verification, review, and handoff records |

## Operating Model

The human owner raises problems, sets priorities, states constraints, approves
or rejects outcomes, and makes final product judgments.

AI agents decompose work, investigate, plan, implement, verify, review, document,
and maintain durable memory. Agents are role and context boundaries, not
personalities.

## Default Workflow

```txt
Intake -> Investigation -> ExecPlan -> Implementation -> Verification -> Review -> Handoff -> Memory Update
```

Do not skip verification or handoff for non-trivial work.
