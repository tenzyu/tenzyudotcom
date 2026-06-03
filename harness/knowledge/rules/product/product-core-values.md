---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.product.core-values
title: Product Core Values
status: active
tags:
  - product
  - sense
  - strategy
  - subject:strategy
  - kind:rule
  - criticality:medium
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: サイトの長期的価値を保護し、不要な機能の肥大化を防ぐ。
    chapter: Intelligence
---

# Product Core Values

このサイトは「Durable Memory（永続的な記憶）」と「Living Curation（生きたキュレーション）」のための「庭（Garden）」である。

- **Owned Identity**: 制作物と文体を自分のドメインに集約する。
- **Utility for Self**: 自分自身が毎日使うための道具（Pointers等）を持つ。
- **Lightweight Admin**: 更新の摩擦を極限まで減らし、継続性を重視する。

**Avoid:**

```text
// 自分では使わない、単なる見栄えのための複雑な機能を追加する
// 更新が面倒な重厚な CMS 機能を導入し、更新が途絶える
```

**Prefer:**

```text
// 自分が毎日開きたくなるような便利なダッシュボード機能を優先する
// スマホからでも 1 分でリンクを追加できる軽量な仕組みを維持する
```
