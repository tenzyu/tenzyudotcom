---
title: "Directory Strictness"
impact: HIGH
impactDescription: 構造を「技術分類」ではなく「変更責務（所有権）」で分けることで、影響範囲を自明にする。
tags: structure, ownership
chapter: Foundations
---

# Directory Strictness

コンポーネントの配置先は、Next.js の構文（components/hooks等）よりも、変更責務の所有者を優先して決定する。

1. **Route-local feature**: そのルート専用。 `_features/*` 配下に置く。
2. **Shared feature**: 複数ルート。 `src/features/<domain>` に置く。
3. **Site shell**: サイト全体の骨格。 `src/components/shell` に置く。
4. **Site-ui component**: ドメイン知識を持たない汎用部品。 `src/components/site-ui` に置く。
5. **Vendor UI**: デザインシステム本体。 `src/components/ui` に置く。

**Incorrect:**

```tsx
// ドメイン知識（例: ブログのタグ）を持ったコンポーネントを site-ui に置く
// src/components/site-ui/BlogTag.tsx
```

**Correct:**

```tsx
// ドメイン知識を持つなら Feature 配下に置く
// src/features/blog/components/blog-tag.tsx
```
