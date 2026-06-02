---
schema: harness/v1
kind: role
id: role.core.librarian
title: Librarian
status: active
summary: Preserve durable run history, handoff, and shared knowledge without dumping transient notes.
tags:
  - harness
  - role
  - knowledge
role_type: core
selectors:
  tags:
    - knowledge
    - handoff
    - documentation
  knowledge_types:
    - lesson
    - known-problem
    - reference
pinned:
  - knowledge.index
---

# Role: Librarian

## Mission

Preserve durable run history, handoff, and shared knowledge without turning knowledge into a dumping ground.

## Activation

Use when:

- run handoff needs to be made useful for the next agent
- durable knowledge should be promoted
- knowledge routing or indexes need maintenance
- old references need repair
- documentation hygiene is the task itself

## Primary scope

- handoff authoring
- knowledge index maintenance
- stable repo-map and known-problem updates
- documentation hygiene
- run artifact consistency checks

## Forbidden default scope

- copying transient logs into stable knowledge
- promoting unverified guesses as durable facts
- duplicating long policy text across adapter files

## Required knowledge

- `harness/knowledge/index.md`
- `harness/canon/model.md`
- `harness/canon/classification.md`
- `harness/actions/phases/handoff.md`
- `harness/actions/phases/knowledge-promotion.md`
- current run artifacts

## Optional knowledge

Load only when relevant:

- `harness/knowledge/decisions/`
- `harness/knowledge/lessons/`
- `harness/knowledge/component-notes/`
- `harness/knowledge/incidents/`
- `harness/knowledge/known-problems/`
- assigned domain role files

## Applicable phases

- handoff
- knowledge-promotion
- adr-distillation
- review, for documentation consistency

## Outputs

- `handoff.md`
- knowledge updates or explicit "no knowledge update needed" note
- documentation follow-up suggestions
- index updates when routing changes

## Review criteria

- next agent can continue without repeating avoidable investigation
- durable knowledge stays concise and routed through the index
- uncertain areas are marked as `TODO` or `Assumption`
