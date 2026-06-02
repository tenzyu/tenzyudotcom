---
schema: harness/v1
kind: knowledge
knowledge_type: rule
id: knowledge.rule.implementation.tool-bundle-hygiene
title: Bundle Hygiene
status: active
tags:
  - bundle
  - performance
  - import
impact: HIGH
x:
  legacy:
    impactDescription: バンドルサイズの肥大化を防ぎ、import 経路の ownership を明示する。
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
