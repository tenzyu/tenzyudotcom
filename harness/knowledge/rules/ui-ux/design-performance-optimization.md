---
schema: harness/v1
kind: knowledge
knowledge_type: rule
id: knowledge.rule.ui-ux.performance-optimization
title: Performance Optimization
status: active
tags:
  - performance
  - nextjs
  - bundle
impact: HIGH
x:
  legacy:
    impactDescription: 初期ロードの高速化と、インタラクションの応答性を限界まで高める。
    chapter: UI & UX
---

## Performance Optimization

ウォーターフォール、過大バンドル、不要な再レンダリングを抑える。

**Avoid:**

```tsx
const a = await getA()
const b = await getB()
```

**Prefer:**

```tsx
const [a, b] = await Promise.all([getA(), getB()])
```
