---
title: "Local-first, Promote-later"
impact: HIGH
impactDescription: 早期の抽象化を防ぎ、機能の独立性を高めることで変更の波及を抑える。
tags: architecture, organization
chapter: Foundations
---

# Local-first, Promote-later

再利用の「可能性」ではなく、実際の「再利用の事実」に基づいて共有化（Promote）を行う。
まずは利用箇所の最も近く（route-local な `_features` 配下）に配置し、2箇所以上のルートで必要になった段階で `src/features` 等へ昇格させる。

**Incorrect:**

```tsx
// 再利用されるかもしれないという理由で、最初から共通ディレクトリに置く
// src/components/site-ui/SpecificFeatureButton.tsx
```

**Correct:**

```tsx
// まずは使う場所（ルート内）の近くに置く
// src/app/[locale]/(main)/notes/_features/note-action-button.tsx
```
