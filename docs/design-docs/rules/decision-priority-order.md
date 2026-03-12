---
title: "Decision Priority Order"
impact: HIGH
impactDescription: 複数の設計原理が衝突した際の判断基準を明確にし、一貫性を保つ。
tags: architecture, decision, strategy
chapter: Intelligence
---

# Decision Priority Order

設計判断では以下の優先順位を遵守する。

1. **Owner Tree**: `src/app` のどの owner が持つべきか
2. **Import Facts**: 実際にどの owner から参照されているか
3. **Shared Class**: primitive / config / lib / cross-branch shared のどれか
4. **Workflow & Proximity**: 一緒に直すものを近くへ置く
5. **Pattern**: components/hooks/lib 等の構文整理

**Incorrect:**

```text
// 構文の美しさ（Pattern）を優先して、機能のまとまり（Workflow）をバラバラにする
// 将来的な再利用を予想して、最初から Shared に配置する
```

**Correct:**

```text
owner tree と import facts を先に決め、その後で shared 層や構文整理を選ぶ
```
