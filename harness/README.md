# tenzyudotcom Harness

This directory is the canonical local harness for AI-assisted work in `tenzyudotcom`.

It is not a generic autonomous agent framework. It is the repository-owned control layer that turns agent work into scoped tasks, reusable knowledge, constrained action, observable evidence, and durable handoff.

## Operating Model

```text
Knowledge   = reduces repeated human input
Action      = controls the task lifecycle
Observation = reduces repeated human review
Run         = one bounded execution record
Policy      = action boundary and completion constraint
Adapter     = thin external-agent entrypoint
```

The core loop is:

```text
Knowledge -> Action -> Observation -> Knowledge
```

An executor may be Codex, Claude Code, Gemini, opencode, Hermes, a shell script, or a human. The executor may change. The harness contract remains.

## Canonical Directories

| Directory | Role |
| --- | --- |
| `canon/` | Harness definition, model, glossary, and legacy source records. |
| `knowledge/` | Curated reusable context: architecture, product specs, ADRs, rules, known problems, and lessons. |
| `policies/` | Constraints: permissions, scope, quality, decision ownership, context budget, tool usage, release, and verification rules. |
| `actions/` | Work lifecycle: workflows, roles, and artifact templates. |
| `runs/` | Concrete work records: task, plan, worklog, verification, review, handoff. |
| `observations/` | Cross-run audits, reports, checklists, and observation templates. |
| `adapters/` | Thin tool-specific bootstraps for root AGENTS/CLAUDE/GEMINI and other executors. |
| `legacy/` | Historical documents retained for traceability but not canonical. |

## Completion Standard

A non-trivial run is not complete because an agent says it is complete. It is complete only when scope, non-goals, validation, evidence, risk, handoff, and memory-promotion decisions are recorded.

## Non-Core by Default

Do not add an agent engine, tool marketplace, plugin runtime, MCP runtime, dashboard, daemon, or multi-agent coordinator until the repository has a repeated problem that cannot be solved by Knowledge / Action / Observation / Run / Policy / Adapter.
