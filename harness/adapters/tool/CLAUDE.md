---
schema: harness/v1
kind: adapter
id: adapter.tool.claude
title: Tool Claude Adapter
status: active
summary: Generator source for Claude root adapter routing.
tags:
  - harness
  - adapter
  - claude
---

# Adapter: CLAUDE.md

Root `CLAUDE.md` should route Claude Code to `harness` for repository memory and workflow rules.

Durable discoveries should be proposed under `harness/knowledge/`, not kept only in tool-local memory.

Role files under `harness/actions/roles/` are the preferred context routing entrypoint.
