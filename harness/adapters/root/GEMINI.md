---
schema: harness/v1
kind: adapter
id: adapter.root.gemini
title: "Root GEMINI Adapter"
status: active
summary: "Root Gemini adapter that routes work through Atelier."
tags:
  - harness
  - adapter
  - root
tool_source: "harness/adapters/tool/GEMINI.md"
---

# GEMINI.md

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

Stable knowledge lives in `harness/`. Durable task notes are optional Markdown
records, not required CLI-managed run state.
