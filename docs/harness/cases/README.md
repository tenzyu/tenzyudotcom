---
name: harness-cases
description: Entry point for concrete cases, evidence, and operational tradeoffs that should not be promoted into harness rules.
summary: Use this subtree for concrete successes, failures, and evidence-backed strategy notes. Each top-level file is an index card with low-friction frontmatter and only relative body references.
read_when:
  - harness references tell you what rule to apply, but you still need a concrete example or tradeoff record
  - you need prior evidence for editorial storage, revalidation, or similar implementation choices
  - you want implementation-specific context without inflating docs/harness/references
skip_when:
  - you are deciding repo-wide rules, placement, or guardrails; read docs/harness/references first
body_convention:
  - keep the top-level file to frontmatter plus relative body paths only
  - put substantive prose in a child directory such as ./<slug>/body.md
  - keep frontmatter optimized for routing: summary, read_when, skip_when, and similar friction-reducing hints
user-invocable: false
---

# Cases

このディレクトリは、harness に昇格させない具体知を置く。
top-level file は入口カードとして扱い、本文は子ディレクトリへ逃がす。

## What Belongs Here

- 具体的な成功条件
- 失敗要因
- 検討して捨てた分岐
- 実装に紐づく tradeoff
- source 付きの運用メモ

## What Does Not Belong Here

- repo-wide rule
- path placement の第一候補
- guard の正規ルール
- product spec や repo 固有の恒久仕様

それらは `docs/harness/references` または `docs/harness/repo-specific` に置く。
