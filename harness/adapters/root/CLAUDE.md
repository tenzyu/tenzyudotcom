---
schema: harness/v1
kind: adapter
id: adapter.root.claude
title: "Root CLAUDE Adapter"
status: active
summary: "Root Claude adapter that routes work through Atelier."
tags:
  - harness
  - adapter
  - root
generated: true
generator: atelier generate
tool_source: "harness/adapters/tool/CLAUDE.md"
generated_at: "2026-06-03T10:19:08.597Z"
---

# CLAUDE.md

Do not manually discover harness context first.

Use Atelier.

```bash
atelier run init --workflow workflow.isolated-run --role role.core.implementer --path . --intent "<request>"
```

Read `harness/runs/active/<RUN-ID>/context.md`.

```bash
atelier run close <RUN-ID>
```

Stable knowledge lives in `harness/`. Root adapters stay short and route agents into Atelier.
