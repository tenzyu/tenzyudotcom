---
schema: harness/v1
kind: adapter
id: adapter.root.agents
title: "Root AGENTS Adapter"
status: active
summary: "Root Codex-style adapter that routes agents through Atelier."
tags:
  - harness
  - adapter
  - root
tool_source: "harness/adapters/tool/AGENTS.md"
---

# AGENTS.md

Do not manually discover harness context first.

Use Atelier context planning.

```bash
atelier context plan --workflow workflow.isolated-run --role role.core.implementer --path . --intent "<request>"
```

Use the plan to choose relevant context, risks, and validation commands. External
LLM runners own task execution and edit the repository directly.

```bash
bun nx run <project>:check
```

Stable knowledge lives in `harness/`. For work that needs durable handoff or
review, materialize a resumable run capsule:

```bash
atelier task create --title "<title>" --description "<description>" --path <path> --role <role>
atelier run create --task <task-id>
atelier run resume <run-id>
```

The Run Plane exposes 7 subcommands: `create | list | inspect | resume | handoff |
verify | complete`. A run capsule is a portable directory at
`harness/runs/active/<run-id>/` that any external LLM runner or human operator
can read in the canonical order:

```text
manifest.json
handoff.md
brief.md
plan.md
context.md
verification.md
review.md
worklog.md
artifacts.md
```

Durable run capsules are optional. Tasks that complete inside a single chat
session may remain in the Task Plane only.
