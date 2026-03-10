---
title: "Decision Priority Order"
impact: HIGH
impactDescription: 複数の設計原理が衝突した際の判断基準を明確にし、一貫性を保つ。
tags: architecture, decision, strategy
chapter: Intelligence
---

# Decision Priority Order

設計判断では以下の優先順位を遵守する。

1. **Ownership**: そのコードの所有者は誰か（Local か Shared か）。
2. **Attribute**: 最上位属性は何か（Feature, Shell, Site-UI, Logic, Content）。
3. **Workflow & Proximity**: 作業動線と近接性を優先し、認知負荷を下げる。
4. **Pattern**: 構文的な整理（Pattern 分割）は最後に行う。
5. **Promote**: 実際の再利用が発生した後に共通化する。

**Incorrect:**

```text
// 構文の美しさ（Pattern）を優先して、機能のまとまり（Workflow）をバラバラにする
// 将来的な再利用を予想して、最初から Shared に配置する
```

**Correct:**

```text
// 修正時に同時に触るファイルを近くに置く（Proximity）
// 2箇所以上で使われるまでは、特定のルート内に閉じ込める
```
