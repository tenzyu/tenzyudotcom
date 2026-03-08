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

## Structure & Operation Expectations

repo-specific ドキュメントも軽量な index card 構成を維持したまま、構造と運用の妥当性を明示する。
具体的には:

- トップレベルファイルの frontmatter に対象範囲、読みどころ、スキップ条件を明記し、本文は `./<slug>/body.md` へ振り分ける。
- どの runtime boundary、owner、workflow に依存するのかを明文化し、必要なら `cases` での対照ケースを参照させる。
- 既存コードに引っ張られる傾向が強い分岐では、「この歴史的経緯を参照せずに運用ルールを優先する」という宣言を添えておく。
- 運用手順を変更するときは、このディレクトリにその背景と通った確認ステップを残し、次の reviewer が再発防止できるようにする。

このようにして、repo-specific 以下を「このリポジトリ固有の durable な意思決定の archive」としながら、構造と運用の検証にも使えるように保つ。
