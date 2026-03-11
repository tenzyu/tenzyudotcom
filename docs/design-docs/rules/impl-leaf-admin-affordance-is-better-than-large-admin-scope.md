---
title: Leaf Admin Affordance Is Better Than Large Admin Scope
impact: HIGH
impactDescription: AdminGate で大きく囲うより、差し込みたい一点だけ囲う方が UI と保守性の両面で優れる。
tags: admin, ux, composition
chapter: Implementation
---

## Leaf Admin Affordance Is Better Than Large Admin Scope

`AdminGate` で大きな範囲を囲うと、public UI と admin UI が密結合する。

**Incorrect:**

```tsx
<AdminGate>
  <LargeAdminAreaForWholePage />
</AdminGate>
```

**Correct:**

```tsx
<Card>
  <AdminGate>
    <ItemAdminMenu />
  </AdminGate>
</Card>
<AdminGate>
  <ItemAddButton />
</AdminGate>
```
