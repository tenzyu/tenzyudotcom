---
name: harness-repo-specific
description: 永続的ではあるが、一般的なharnessルールとして扱うべきではない、リポジトリ固有のプロダクトとアーキテクチャのドキュメント。
summary: 安定したリポジトリ固有の仕様、プロダクトの方向性、アーキテクチャに関するノートのためにこのサブディレクトリを使用する。
read_when:
  - 既存のプロダクト仕様またはアーキテクチャルールを修正する時
  - グローバルなharnessよりもここに置く方が安全だと感じる、新しいリポジトリ固有のルールを作成する時
skip_when:
  - ルールがグローバルな境界、ツール、またはメモリアウトを定義する時（それらは参照にある）
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
