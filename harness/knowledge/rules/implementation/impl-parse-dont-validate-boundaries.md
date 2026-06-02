---
schema: harness/v1
kind: knowledge
knowledge_type: rule
id: knowledge.rule.implementation.parse-at-boundaries
title: Parse At Boundaries
status: active
tags:
  - validation
  - boundary
  - zod
impact: HIGH
x:
  legacy:
    impactDescription: 外部入力を未確定なまま流さず、境界で parse して内部型を確定させる。
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
