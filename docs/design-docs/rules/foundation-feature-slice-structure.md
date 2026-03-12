---
title: Feature Slice Structure
impact: HIGH
impactDescription: 機能単位の探索性を保ち、水平分割や早すぎる細分化を防ぐ。
tags: structure, organization, vsa
chapter: Foundations
---

## Feature Slice Structure

構造は水平レイヤーより vertical slice を優先する。  
`src/app/.../_features` を feature の基本単位とし、小さい feature は flat に保つ。

**Avoid:**

```text
src/components/FeatureA.tsx
src/hooks/useFeatureA.ts
src/types/feature-a.ts

src/app/.../_features/
  components/my-button.tsx
  lib/utils.ts
```

**Prefer:**

```text
src/app/[locale]/.../route/_features/
  feature-a.tsx
  feature-a-hooks.ts
  feature-a-types.ts

ファイル数が少ない間は _features 配下を flat に保ち、
読み筋が分かれ始めてから components/ hooks/ lib/ を掘る
```

