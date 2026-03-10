---
title: "6-Layer Ownership Model"
impact: HIGH
impactDescription: 全てのコードに一意の所有者を定義し、配置迷子（Dumping Ground）を根絶する。
tags: architecture, ownership, organization
chapter: Foundations
---

# 6-Layer Ownership Model

コードの「役割」や「構文」ではなく、「誰がその責任を持つか」に基づいて配置を決定する。

1. **local feature**: `src/app/.../_features/` (特定のルート専用)
2. **promoted feature**: `src/features/` (複数ルートで再利用されるドメイン機能)
3. **site shell**: `src/components/shell/` (サイトの骨格)
4. **site-ui component**: `src/components/site-ui/` (汎用プレゼンテーション部品)
5. **pure shared logic**: `src/lib/`, `src/config/` (クロスルートの純粋ロジック・設定)
6. **authored content**: `storage/` 配下（`blog/*.mdx`, `editorial/*.json` 等）の人間が管理し Vercel Blob と同期するデータ

**Incorrect:**

```text
// 1箇所でしか使わないのに、最初から src/components/ に置いてしまう
src/components/SpecificButton.tsx
```

**Correct:**

```text
// 使う場所の隣から始め、再利用の事実が出たら昇格（Promote）させる
src/app/[locale]/.../_features/specific-button.tsx
```
