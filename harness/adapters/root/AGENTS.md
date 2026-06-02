---
schema: harness/v1
kind: adapter
id: adapter.root.agents
title: Root AGENTS Adapter
status: active
summary: Root Codex-style adapter that routes agents to canonical harness instructions.
tags:
  - harness
  - adapter
  - agents
---

# AGENTS.md

Use `harness` as the canonical project memory and workflow system.

## Start here

- `harness/canon/model.md`
- `harness/policies/repository.md`
- `harness/actions/workflows/README.md`
- `harness/actions/roles/README.md`
- `harness/policies/tools/git.md`
- `harness/policies/tools/nx.md`

## Operating rule

Do not load all harness knowledge by default.

For non-trivial work:

1. choose a callable workflow
2. assign the smallest safe role set
3. load role-required knowledge
4. execute the required phases
5. record verification and handoff evidence

## Required run artifacts

- `brief.md`
- `worklog.md`
- `verification.md`
- `handoff.md`
- `plan.md` for non-trivial strategy
- `review.md` for independent review
