---
title: Symbol Ownership Repair Guide
impact: HIGH
impactDescription: lint-symbol-ownership の promote / demote 判断を、owner tree と least common owner の観点で直せるようにする。
tags: reference, lint, ownership
chapter: References
---

## Symbol Ownership Repair Guide

`lint-symbol-ownership` は exported symbol が今の owner に置かれるべきかを見ている。  
まず `declarationOwner`、`referenceOwners`、`targetOwner` の 3 点だけを見る。

**Check:**

```text
demote: shared owner にある symbol が実際には 1 つか少数 app owner からしか使われていない
promote: route-local symbol が複数 app owner から使われ、least common owner へ上げるべき
```

**Read Next:**

- [](/docs/design-docs/rules/foundation-owner-placement-layers.md)
- [](/docs/design-docs/rules/foundation-promotion-by-usage.md)
- [](/docs/design-docs/rules/foundation-feature-slice-structure.md)
