---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.intelligence.harness-memory-model
title: Harness Memory Model
status: active
tags:
  - harness
  - memory
  - documentation
  - domain:harness
  - subject:harness-memory
  - kind:rule
  - criticality:high
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: ハーネス更新と知識保存先の判断を一体で定義し、暗黙知とコンテキスト汚染を防ぐ。
    chapter: Intelligence
---

## Harness Memory Model

ハーネスはコード変更と同時に保守し、情報の性質ごとに保存先を分ける。

**Avoid:**

```text
ドキュメントを更新せずにアーキテクチャを変える
恒久的なルールを一時的な TODO や会話ログに閉じ込める
過去の失敗を永続化せず同じ実装ミスを繰り返す
```

**Prefer:**

```text
session: 作業中のみ
repo/structural: AGENTS.md や構造そのもの
durable: design-docs と exec-plans/completed

構造変更時は harness/knowledge/*.md も更新する
複雑な判断の経緯は harness/runs/completed/ に残す
```
