---
name: ai-reports
description: Concrete failure reports, success conditions, and decision branches that should not bloat the harness.
user-invocable: false
---

# AI Reports

このディレクトリは、AI エージェント運用で得た具体知を蓄積する。
harness の代わりではない。

## Purpose

ここに置くのは、次のような「ケースに根ざした知識」である。

- 何が失敗したか
- なぜ失敗したか
- どうすれば成功したか
- どの分岐を検討し、なぜ捨てたか
- 既存コードに引っ張られると何を誤るか
- 実装前に何を確認すべきだったか

具体の話はここに置く。
再利用可能な最小ルールだけを、後で `docs/harness` に昇格する。

## Non-Goals

ここを full spec の保管庫にしない。

- repo 全体の原理
- path placement の第一候補
- guard rule
- tool boundary の正規ルール

これらは `docs/harness` に置く。

## Recommended Shape

新しい report では、必要に応じて次を含める。

- Context
- Failed attempt
- Why it failed
- Success condition
- Rejected branches
- What should be promoted to harness, if any

## Relationship To Harness

- harness は rule と declaration を持つ
- ai-reports は case と evidence を持つ

迷ったら、短く再利用可能な判断は harness、
具体的で経緯依存の知識は ai-reports に置く。

既存の `*-spec.md` は legacy として残っていてよいが、
新規追加や更新では report 形式を優先する。
