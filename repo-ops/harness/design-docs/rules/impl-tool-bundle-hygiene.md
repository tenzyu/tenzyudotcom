---
title: Bundle Hygiene
impact: HIGH
impactDescription: バンドルサイズの肥大化を防ぎ、import 経路の ownership を明示する。
tags: bundle, performance, import
chapter: Implementation
---

## Bundle Hygiene

内部コードの barrel import は原則禁止とし、必要な source file を直接 import する。

**Avoid:**

```typescript
import { a, b, c } from "@/features/notes"
```

**Prefer:**

```typescript
import { a } from "@/features/notes/components/a"
```

