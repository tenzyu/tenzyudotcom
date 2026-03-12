---
title: Tool Boundaries
impact: HIGH
impactDescription: 道具ごとの責務を固定し、交換不可能な密結合を防ぐ。
tags: tools, boundaries, dependency
chapter: Foundations
---

## Tool Boundaries

それぞれの道具が担当する境界を越えない。

**Avoid:**

```text
presentation primitive に app-owned workflow や data logic を混ぜる
```

**Prefer:**

```text
Intlayer: localized meaning
shadcn/ui: base UI
src/components: presentation primitive
src/app/**/_features: app-owned feature
src/features: app tree で自然に置けない cross-branch shared
```

