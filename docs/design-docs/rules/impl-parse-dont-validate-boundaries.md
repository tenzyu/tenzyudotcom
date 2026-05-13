---
title: Parse At Boundaries
impact: HIGH
impactDescription: 外部入力を未確定なまま流さず、境界で parse して内部型を確定させる。
tags: validation, boundary, zod
chapter: Implementation
---

## Parse At Boundaries

外部 API、frontmatter、URL、Server Action 入力などの boundary data は、境界で parse してから内部へ渡す。

**Avoid:**

```tsx
const data = await res.json() as UnsafeType
```

**Prefer:**

```tsx
const data = MySchema.parse(await res.json())
```

