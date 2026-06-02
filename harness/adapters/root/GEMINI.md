---
schema: harness/v1
kind: adapter
id: adapter.root.gemini
title: Root Gemini Adapter
status: active
summary: Root Gemini adapter that routes work through Atelier before mutable work.
tags:
  - harness
  - adapter
  - gemini
---

# GEMINI.md

Canonical AI work instructions live under `harness`.

For non-trivial work, do not manually discover harness context first. Use Atelier.

## Required Start

```bash
atelier run init --workflow isolated-run --intent "<request>"
```

Then read the generated `context.md` and follow its workflow, role, phase, and artifact instructions.

For small docs/config/reference repairs, use:

```bash
atelier run init --workflow direct-run --intent "<request>"
```

## Completion Gate

Before claiming completion, run:

```bash
atelier run close <RUN-ID>
```

If Atelier is unavailable, manually start with:

- `harness/canon/model.md`
- `harness/policies/repository.md`
- `harness/actions/workflows/README.md`
- `harness/actions/roles/README.md`
- `harness/policies/context-budget.md`

Record any fallback in `worklog.md`.
