---
name: harness-repo-specific
description: Repo-specific product and architecture documents that are durable but should not be treated as general harness rules.
summary: Use this subtree for stable repo-specific specs, product direction, and architecture notes. Each top-level file is an index card with routing frontmatter and only relative body references.
read_when:
  - a task depends on this repository's product goals or editorial operating model
  - you need a stable repo-specific spec that should not live in cases or harness references
skip_when:
  - you only need generic harness rules; start from docs/harness/references
body_convention:
  - keep the top-level file to frontmatter plus relative body paths only
  - place substantive prose in ./<slug>/body.md
  - use frontmatter to state when the doc matters and what it covers
user-invocable: false
---

# Repo-Specific

このディレクトリは、この repo に固有の durable spec を置く。
harness rule と case record の中間で迷う文書は、まずここを検討する。

## Typical Contents

- product goal
- repo 固有の architecture note
- collection spec
- admin operating model

## Exclusions

- repo-wide harness rule
- generic guard
- path placement の標準
- 単発の失敗報告や source 付きケース記録
