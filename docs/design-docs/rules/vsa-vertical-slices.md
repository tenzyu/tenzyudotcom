---
title: "Vertical Slice Architecture (VSA)"
impact: HIGH
impactDescription: 変更の影響をスライス内に閉じ込め、機能単位での開発・削除を容易にする。
tags: architecture, organization, vsa
chapter: Foundations
---

# Vertical Slice Architecture (VSA)

レイヤーによる水平分割（UI層、Logic層、Data層）ではなく、機能（Feature）による垂直分割を基本とする。
Next.js のルートディレクトリ内に `_features` サブディレクトリを作成し、その中に UI、Logic、Data を一つのスライスとして閉じ込める。

**Incorrect:**

```text
// レイヤーで分かれている（機能 A を直すのに 3 箇所見る必要がある）
src/components/FeatureA.tsx
src/hooks/useFeatureA.ts
src/types/feature-a.ts
```

**Correct:**

```text
// 機能で閉じている（機能 A のスライス内で完結する）
src/app/[locale]/.../route/_features/
  ├── feature-a.tsx
  ├── feature-a.model.ts
  └── feature-a.hook.ts
```
