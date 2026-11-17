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

Atelier, Castalia, pointers, puzzles, recommendations and the old execution harness were retired. Preserve the site’s blog/notes/scraps/links/tools/osu/portfolio, the standalone workbench and external content. Do not interpret a historical inventory's “delete candidate” as permission to delete user data.

**All nine ADR files are immutable**: `harness/adr`, `harness/knowledge/decisions/adr`, and `harness/atelier-design-docs/ADRs`. They remain accessible; their old instructions need not be implemented when obsolete.

For current workflow, branch from `develop`, submit PR to `develop`, and only subsequently integrate into `main`.

# Evidence lifecycle

2026-10-29 preliminary “unapproved” classifications were superseded by November approvals/implementation. The original interim reports, remote host investigations, handoffs, and detailed logs are accessible at the [fixed pre-Dreaming commit](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal). The retained [retirement report](../renewal/11-retirement-unit.md) and [completion report](../renewal/12-completion.md) summarize verified outcomes and untested conditions.

Keep reproducible error mechanisms, trust limits, remaining operational risks, accepted decisions and provenance. Prune ephemeral commands/temporary paths and redundant narration. No `verified` frontmatter was minted here: inspecting sources is not equivalent to running the full suite or confirming today's server.
