---
schema: harness/v1
kind: workflow
id: workflow.promote-knowledge
title: Promote Knowledge
status: active
callable: true
summary: Promote durable reusable knowledge from run evidence into harness knowledge.
tags:
  - harness
  - workflow
  - knowledge
phases:
  - phase.knowledge-promotion
  - phase.verification
  - phase.handoff
---

# Workflow: Promote Knowledge

Use this workflow when a run produced durable reusable knowledge.

## Role assignment

Use:

```txt
primary: roles/core/librarian.md
support: original domain role when domain-specific knowledge is promoted
support: roles/core/architect.md when promoting architecture decisions
```

## Required phase

- `../phases/knowledge-promotion.md`

## Sources

- run `worklog.md`
- run `verification.md`
- run `review.md`
- run `handoff.md`
- source code facts
- owner-confirmed decisions

## Destinations

- `harness/knowledge/decisions/`
- `harness/knowledge/decisions/adr/`
- `harness/knowledge/lessons/`
- `harness/knowledge/component-notes/`
- `harness/knowledge/incidents/`
- `harness/knowledge/known-problems/`
- relevant rule or product-spec files under `harness/knowledge/`

## Rule

Do not promote raw logs, one-off guesses, stale implementation details, or transient task context.
