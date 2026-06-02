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
generated: true
generator: atelier generate
tool_source: "harness/adapters/tool/GEMINI.md"
generated_at: "2026-06-02T12:43:05.317Z"
---

# GEMINI.md

Do not manually discover harness context first.

Use Atelier.

```bash
atelier run init --workflow isolated-run --intent "<request>"
```

Read `harness/runs/active/<RUN-ID>/context.md`.

```bash
atelier run close <RUN-ID>
```

Stable knowledge lives in `harness/`. Root adapters stay short and route agents into Atelier.
