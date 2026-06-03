---
schema: harness/v1
kind: phase
id: phase.design-direction
title: Design Direction
status: active
summary: Explore design directions, evaluate trade-offs, and commit to an approach.
tags:
  - harness
  - phase
  - design-direction
---

# Phase: Design Direction

Explore the problem space, identify candidate approaches, evaluate trade-offs, and commit to a design direction.

This phase happens before any detailed design or implementation.

## Primary perspective

Architect or domain lead.

## Output

Append to `plan.md`:

- problem restatement
- candidate directions (2-3 minimum when the approach is unclear)
- trade-off comparison per direction
- chosen direction with rationale
- rejected directions with reasons
- open questions that block direction selection

Also consider creating ADR candidates for material decisions.

## Rules

- Do not skip direction exploration for non-obvious problems.
- Document why rejected directions were rejected — this prevents re-exploration.
- If the problem is well-understood with a single obvious direction, skip straight to `design-detailing` and note the reasoning.
- If direction selection requires external input, record the open questions and check with the requestor.
- Knowledge boundary rules (import boundaries, export restrictions, tool boundaries) must be checked against each candidate direction before selection.
- Scope and non-goals from intake constrain the direction space — do not select a direction that violates scope unless scope is explicitly adjusted.
