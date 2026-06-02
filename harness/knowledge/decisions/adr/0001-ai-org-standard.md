# ADR 0001: AI Organization Standard

## Status

Accepted

## Decision

Use `harness/ai-org` as the canonical Markdown-based AI organization layer for
tenzyudotcom. Root AI files are adapters only.

## Context

The repository needs a tool-neutral way for Codex, Claude, Gemini, and future
agents to share roles, workflows, task history, verification, handoff, and
durable memory.

## Consequences

- Non-trivial work should create task artifacts.
- Verification and handoff are required before claiming completion.
- Durable memory lives under `harness/ai-org/memory`.
- LLM-facing workflows, rules, execution plans, references, and ADRs live under `harness/ai-org`.
- Human-facing repository and product contracts stay under `docs`.
