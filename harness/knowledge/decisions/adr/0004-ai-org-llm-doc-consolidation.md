# ADR 0004: Consolidate LLM-Facing Harness Documents Under AI Org

## Status

Accepted

## Context

The harness had become fragmented across `docs/`, `harness/ai-org/`, and `repo-ops/harness/`. Human-facing docs still belong in `docs/`, but LLM-facing workflows, rules, execution plans, reports, references, and ADRs need one canonical home so agents can load context predictably.

The owner was interviewed during `TASK-0013-ai-org-harness-rebuild` and chose:

- Move all LLM-facing documents into `harness/ai-org/`.
- Move ADRs into `harness/ai-org/` instead of keeping `docs/ADR` canonical.

## Decision

Use `harness/ai-org/` as the canonical root for LLM-facing harness material, including ADRs.

Formal ADRs live under:

```txt
harness/ai-org/memory/decisions/adr/
```

Human-facing repository and product documentation may remain under `docs/`.

## Alternatives Considered

- Keep `docs/ADR` canonical and only mirror AI summaries under `harness/ai-org/memory/decisions`.
- Move only obvious harness documents and leave design rules, reports, and execution plans in `docs/`.
- Keep `repo-ops/harness` as a redirect.

## Consequences

- Agents have one canonical LLM-facing root.
- `docs/` becomes primarily human-facing and product/repository-contract oriented.
- Existing path references and scripts that assumed `docs/design-docs`, `docs/exec-plans`, or `docs/ADR` must be updated.
- `repo-ops/harness` is removed.

## Follow-Ups

- Keep root adapter files short and pointed at `harness/ai-org/`.
- Update linter and docs generation paths when harness document structure changes.
- Interview the owner before future ADR-location or harness-root changes.
