---
type: Reference
title: Decisions and historical provenance
description: Retention policy for accepted architecture and original evidence.
tags: [adr, dreaming, provenance]
status: stable
sources:
  - { resource: ../../harness/adr/0001-renewal.md, title: Approved renewal ADR }
  - { resource: ../renewal/12-completion.md, title: Dated closure }
  - { resource: "https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal", title: Original historical documents }
---

# Accepted

Atelier, Castalia, pointers, puzzles, recommendations and the old agent execution tools were retired. Preserve the site's blog/notes/scraps/links/tools/osu/portfolio, the standalone workbench and external content. Do not interpret a historical inventory's "delete candidate" as permission to delete user data.

All nine ADR files are immutable. Their directories are: `harness/adr`, `harness/knowledge/decisions/adr`, and `harness/atelier-design-docs/ADRs`. They remain accessible. Obsolete instructions no longer apply.

Create topic branches from `develop` and submit pull requests to `develop`. Integrate into `main` afterward.

# Evidence lifecycle

The November approvals and implementation superseded the preliminary "unapproved" classifications from 2026-10-29. The original interim reports, remote host investigations, handoffs, and detailed logs are accessible at the [fixed pre-Dreaming commit](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal). The retained [retirement report](../renewal/11-retirement-unit.md) and [completion report](../renewal/12-completion.md) summarize verified outcomes and untested conditions.

Keep reproducible error mechanisms, trust limits, remaining operational risks, accepted decisions and provenance. Prune ephemeral commands/temporary paths and redundant narration. This document does not declare `verified` in its frontmatter. Inspecting sources does not establish that the full suite passed or that the server is currently healthy.
