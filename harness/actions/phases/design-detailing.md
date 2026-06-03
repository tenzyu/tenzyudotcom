---
schema: harness/v1
kind: phase
id: phase.design-detailing
title: Design Detailing
status: active
summary: Transform chosen direction into concrete design decisions, interfaces, and specifications.
tags:
  - harness
  - phase
  - design-detailing
---

# Phase: Design Detailing

Transform the chosen design direction into concrete, implementable decisions.

This phase produces design specifications that guide implementation without prescribing every line of code.

## Primary perspective

Domain lead or technical lead.

## Output

Append to `plan.md` or create standalone design documents:

- component or module structure
- interface contracts (types, APIs, boundaries)
- data flow and state management
- dependency graph and injection points
- error handling strategy
- security and reliability considerations
- migration or rollout plan (if incremental)
- test strategy

For each decision, record:

- the decision
- alternatives considered
- rationale (why this over alternatives)
- constraints that influenced the decision

Material decisions should become ADR candidates.

## Rules

- Design at the right level of abstraction — not too vague, not over-specified.
- Reference existing patterns and conventions from loaded knowledge.
- If the design reveals a need for new knowledge (rule, reference, etc.), create a knowledge proposal.
- Validate the design against existing policies and boundary rules before implementation.
- If the design is blocked by an open question, escalate to the direction phase or requestor.
- Update scope and non-goals if the design reveals new constraints.

## Relation to knowledge

While detailing:

1. Check `affordances.declared` of loaded knowledge — they hint at what this knowledge can transform into.
2. If affordance `inferred` signals are detected (via affordance suggestion), consider creating knowledge proposals.
3. If the design relates to existing knowledge via `relations.require_context` or `relations.inherit`, ensure those relations are resolved.
