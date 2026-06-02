# AI Organization Charter

tenzyudotcom is operated as an AI-maintainable development organization.

The target state is:

> The human owner raises problems, sets priorities, and makes final decisions.
> AI agents decompose, investigate, implement, verify, review, document, and
> preserve durable memory.

## Goals

- Keep work role-bounded and scope-bounded.
- Make work reproducible by another agent.
- Preserve decisions, verification, and handoff in repository documents.
- Reduce repeated context loading and duplicate investigation.
- Stay independent from any single AI vendor or tool.

## Human Role

The human owner owns:

- problem statements
- priority decisions
- constraints and non-goals
- approval or rejection
- final product judgment

The human owner should not need to specify every file-level edit when agents can
investigate and plan the work.

## Agent Role

Agents own:

- task decomposition
- repository investigation
- implementation within approved scope
- validation and verification notes
- independent review where possible
- handoff and durable memory maintenance

Agents must not silently broaden scope, remove features, or treat passing tests
as the only evidence of completion.

## Canonical Sources

- `harness/ai-org/` defines how AI agents work and stores LLM-facing workflows, rules, ADRs, execution plans, references, reports, memory, and task history.
- `docs/` defines human-facing repository and product documentation.
- Root tool files are adapters and must not become independent policy stores.
