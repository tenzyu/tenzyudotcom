---
schema: harness/v1
kind: policy
id: policy.tool.nx
title: Nx Guardrails
status: active
summary: Nx invocation, inspection, and validation guardrails.
tags:
  - policy
  - nx
  - tool
---

# Skill: Nx Guardrails

Read this before using Nx.

## Triggers

Use when running `nx`, `bun nx`, project graph queries, generators, build, test, lint, typecheck, verify, affected, or run-many commands.

## Rules

- Invoke Nx through Bun: `bun nx ...`.
- Prefer Nx targets over direct underlying tools.
- Use `bun nx show projects` and `bun nx show project <name> --json` to inspect configuration.
- Do not guess unfamiliar flags; check help or docs first.
- For scaffolding or generators, use the Nx generation workflow/skill first.
- Record Nx loading failures in task verification instead of silently switching tools.

## Common Commands

```bash
bun nx show projects
bun nx show project <project> --json
bun nx run <project>:<target>
bun nx affected -t <target>
bun nx run-many -t check
```

## Broad Validation

For broad changes, prefer:

```bash
bun run policy:deps
bun nx run-many -t check
```
