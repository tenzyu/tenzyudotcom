---
schema: harness/v1
kind: canon
id: canon.classification
title: Harness Classification Rules
status: active
summary: Decision tree for placing Markdown in harness directories.
tags:
  - harness
  - canon
  - classification
---

# Harness Classification Rules

Use this decision tree for Markdown placement.

```text
Does it reduce repeated human input?
  -> knowledge/

Does it constrain action or completion?
  -> policies/

Does it define a lifecycle phase, role, or artifact shape?
  -> actions/

Is it one concrete work execution or backlog item?
  -> runs/

Does it summarize evidence, risk, audit, or review across work?
  -> observations/

Does it bootstrap an external tool into the harness?
  -> adapters/

Is it historical but no longer canonical?
  -> legacy/

Is it product runtime content or conventional package documentation?
  -> keep in product/ or root.
```

Human-only documentation may stay under `docs/`. Product runtime files must not be moved merely because they are Markdown.
