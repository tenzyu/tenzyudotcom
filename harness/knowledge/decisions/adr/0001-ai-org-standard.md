---
schema: harness/v1
kind: knowledge
knowledge_type: adr
pattern: simple
id: knowledge.decision.adr.ai-org-standard
title: 'ADR 0001: AI Organization Standard'
status: active
summary: Establishes harness as the canonical Markdown-based AI organization layer.
tags:
  - adr
  - harness
  - ai-org
  - kind:adr
  - domain:harness
  - domain:agent
  - status:active
affordances:
  declared: [context, review-candidate]
---

# ADR 0001: AI Organization Standard

## Status

Accepted

## Decision

Use `harness` as the canonical Markdown-based AI organization layer for
tenzyudotcom. Root AI files are adapters only.

## Context

The repository needs a tool-neutral way for Codex, Claude, Gemini, and future
agents to share roles, workflows, task history, verification, handoff, and
durable memory.

## Consequences

- Non-trivial work should create task artifacts.
- Verification and handoff are required before claiming completion.
- Durable memory lives under `harness/knowledge`.
- LLM-facing workflows, rules, execution plans, references, and ADRs live under `harness`.
- Human-facing repository and product contracts stay under `docs`.
