---
title: "Tool Boundary & Ownership"
impact: HIGH
impactDescription: ツールの責務を明確にし、密結合による交換不可能性を防ぐ。
tags: tools, boundaries, dependency
chapter: Foundations
---

# Tool Boundary & Ownership

それぞれの道具が担当する境界を厳守する。

| Concern | Owner | Must NOT become |
| :--- | :--- | :--- |
| Localized meaning | Intlayer | fetch input registry / database |
| Base UI | shadcn/ui | domain-aware features |
| Presentation | `site-ui` | domain logic / workflow store |
| Domain logic | `features/` | generic presentation library |

**Incorrect:**

```typescript
// Intlayer の辞書ファイルに、外部 API の ID や URL を直接書き込む
// shadcn の Button.tsx の中に、ブログ記事取得のロジックを書く
```

**Correct:**

```typescript
// 識別子は source.ts に置き、Intlayer と結合する
// shadcn はプリミティブとして使い、Feature 側でラップしてビジネスロジックを載せる
```
