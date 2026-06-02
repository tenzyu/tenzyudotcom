---
schema: harness/v1
kind: adapter
id: adapter.root.agents
title: Root AGENTS Adapter
status: active
summary: Root Codex-style adapter that routes agents through Atelier before mutable work.
tags:
  - harness
  - adapter
  - agents
---

# AGENTS.md

Use `harness` as the canonical project memory and workflow system.

For non-trivial work, do not manually discover harness context first. Use Atelier.

## Required Start

```bash
atelier run init --workflow isolated-run --intent "<request>"
```

Then read the generated `context.md` and follow its workflow, role, phase, and artifact instructions.

If the run is a small docs/config/reference repair, use:

```bash
atelier run init --workflow direct-run --intent "<request>"
```

## Completion Gate

Before claiming completion, run:

```bash
atelier run close <RUN-ID>
```

The close gate verifies required artifacts, selected context hashes, doctor errors, verification evidence, handoff evidence, review requirements, and open knowledge proposals.

## Knowledge Updates

Do not turn ad-hoc findings into stable knowledge by default.

Small direct edits to existing knowledge are allowed when the correction is narrow and obvious. New durable knowledge or non-trivial routing changes should go through:

```bash
atelier knowledge propose --from-run <RUN-ID>
```

Then promote or reject the proposal after review.

## Fallback

If Atelier is unavailable, use the harness manually in this order:

1. `harness/canon/model.md`
2. `harness/policies/repository.md`
3. `harness/actions/workflows/README.md`
4. `harness/actions/roles/README.md`
5. the smallest relevant role files
6. required policies and tool guardrails

Record the fallback in `worklog.md`.
