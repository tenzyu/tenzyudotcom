---
schema: harness/v1
kind: adapter
id: adapter.root.claude
title: Root Claude Adapter
status: active
summary: Root Claude adapter that routes work through Atelier before mutable work.
tags:
  - harness
  - adapter
  - claude
---

# CLAUDE.md

Use `harness` as the canonical project memory and workflow system.

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

Do not treat tool-local memory as the repository source of truth.

## Knowledge Updates

Small direct edits to existing knowledge are allowed when the correction is narrow and obvious. New durable knowledge or non-trivial routing changes should be proposed through Atelier:

```bash
atelier knowledge propose --from-run <RUN-ID>
```

Stable knowledge should not be copied from raw logs without proposal, evidence, and review.
