---
title: "Normative: Target over Current"
impact: HIGH
impactDescription: 既存の負債に引きずられず、一貫したターゲット構造へ収束させる。
tags: architecture, strategy, quality
chapter: Intelligence
---

# Normative: Target over Current

このリポジトリの設計文書は、現状のコード（Current Code）に迎合しない。現状がターゲット（Target Architecture）とズレている場合、その現状を正当化せず、解消すべき負債として扱う。

- **ターゲット優先**: 現状の実装よりも設計原則を優先して評価する。
- **逐次改善**: 一度の変更で全て移行できなくても、局所的にターゲットへ近づける。
- **慣性の停止**: 既存コードを真似てはいけない箇所は、Harness（ドキュメント）側で明確に宣言する。

**Incorrect:**

```text
// 「既存の他のファイルがこうなっているから」という理由で、悪い設計を繰り返す
// 現状の配置に合わせて、ターゲットアーキテクチャの方を書き換える
```

**Correct:**

```text
// 現状が間違っていることを認め、新しい変更では正しい原則を適用する
// 前例（Precedent）にするべきでない箇所を明記し、AI の模倣を止める
```
