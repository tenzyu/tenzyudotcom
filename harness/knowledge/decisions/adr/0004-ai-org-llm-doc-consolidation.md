---
schema: harness/v1
kind: knowledge
knowledge_type: adr
pattern: simple
id: knowledge.decision.adr.ai-org-llm-doc-consolidation
title: 'ADR 0004: Consolidate LLM-Facing Harness Documents Under AI Org'
status: active
summary: Historical decision record for consolidating LLM-facing harness documents.
tags:
  - adr
  - harness
  - migration
  - kind:adr
  - domain:harness
  - subject:migration
  - status:active
affordances:
  declared: [context, review-candidate]
---

# ADR 0004: Consolidate LLM-Facing Harness Documents Under AI Org

## Status

Accepted

## Context

The harness had become fragmented across `docs/`, `harness/`, and `repo-ops/harness/`. Human-facing docs still belong in `docs/`, but LLM-facing workflows, rules, execution plans, reports, references, and ADRs need one canonical home so agents can load context predictably.

The owner was interviewed during `TASK-0013-ai-org-harness-rebuild` and chose:

- Move all LLM-facing documents into `harness/`.
- Move ADRs into `harness/` instead of keeping `docs/ADR` canonical.

## Decision

Use `harness/` as the canonical root for LLM-facing harness material, including ADRs.

Formal ADRs live under:

```txt
harness/knowledge/decisions/adr/
```

Human-facing repository and product documentation may remain under `docs/`.

## Alternatives Considered

- Keep `docs/ADR` canonical and only mirror AI summaries under `harness/knowledge/decisions`.
- Move only obvious harness documents and leave design rules, reports, and execution plans in `docs/`.
- Keep `repo-ops/harness` as a redirect.

## Consequences

- Agents have one canonical LLM-facing root.
- `docs/` becomes primarily human-facing and product/repository-contract oriented.
- Existing path references and scripts that assumed `docs/design-docs`, `docs/exec-plans`, or `docs/ADR` must be updated.
- `repo-ops/harness` is removed.

## Follow-Ups

- Keep root adapter files short and pointed at `harness/`.
- Update linter and docs generation paths when harness document structure changes.
- Interview the owner before future ADR-location or harness-root changes.
