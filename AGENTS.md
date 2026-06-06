# AGENTS.md

## Repository instruction for LLM agents

Do not rely on prior chat context. Read the local control files for the active task before editing.

## Atelier Relation Kernel work

If the task concerns Atelier bootstrap, relation indexing, context assembly, md-to-code transformation, execution packets, or OpenCode agent setup, use this design pack as the local control surface:

```txt
harness/atelier-design-docs/README.md
harness/atelier-design-docs/GOAL-OPERATIONAL-ATELIER.md
harness/atelier-design-docs/REVIEW-LATEST.md
harness/atelier-design-docs/OPEN-QUESTIONS.md
harness/atelier-design-docs/atelier-*/goal.md
harness/atelier-design-docs/atelier-*/contract.md
harness/atelier-design-docs/atelier-*/review.md
```

Current target:

```txt
Upgrade atelier-bootstrap from repository census + demo transform pipeline into a Relation Kernel.
```

Atelier is not a repo explorer. Atelier is the repository-side control plane that creates bounded, traceable relations and execution context for coding agents.

## Non-negotiable boundaries

- `.atelier-bootstrap/**` is tooling.
- `.atelier/v0/**` is generated output, object graph state, relation state, run state, and views.
- `harness/atelier-design-docs/**` is input contract for agents; implementers must not edit it during the goal run.
- `harness/knowledge/product-specs/**` is source/spec input; implementers must not edit it during the goal run.
- `.opencode/**` is agent/runtime configuration; implementers must not edit it during the goal run.
- Generated views are not truth.
- Evidence is runtime fact, not prose.
- If a packet requires broad repository exploration, the packet generator failed.

## Goal-plugin discipline

The OpenCode goal plugin is marker-based. Only `atelier-coordinator` may emit final-line markers:

```txt
[goal:complete]
[goal:blocked]
```

Implementer and reviewer subagents must never emit goal markers.

Use the plugin command directly. Do not shadow it with a custom `command.goal` config.

Recommended invocation:

```txt
/goal @atelier-coordinator Follow @harness/atelier-design-docs/GOAL-OPERATIONAL-ATELIER.md. Use component goal.md, contract.md, and review.md. Dispatch subagents aggressively when boundaries do not overlap.
```

## Validation reporting

Do not claim Bun, Nx, or tests passed unless the command actually ran. If tooling is unavailable, report static inspection only.

Final reports for Atelier work must include:

```txt
Changed files:
Checks run:
Checks not run:
Open questions:
Reviewer status:
Next action:
```
