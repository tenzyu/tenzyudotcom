---
title: Import Boundaries Repair Guide
impact: HIGH
impactDescription: lint-import-boundaries の修正導線を短くし、境界違反の直し方を即座に判断できるようにする。
tags: reference, lint, boundaries
chapter: References
---

## Import Boundaries Repair Guide

`lint-import-boundaries` が落ちたら、まず import 元と import 先の owner を見て、どちらが越境しているかを判定する。

**Check:**

```text
1. route-local _features から別 route-local _features を読んでいないか
2. src/features から src/app/.../_features を読んでいないか
3. *.domain.ts / *.port.ts から *.infra.ts / *.assemble.ts を読んでいないか
4. UI や entrypoint から *.infra.ts を直接読んでいないか
```

**Read Next:**

- [](/docs/design-docs/rules/foundation-owner-placement-layers.md)
- [](/docs/design-docs/rules/foundation-promotion-by-usage.md)
- [](/docs/design-docs/rules/foundation-dependency-inversion.md)
- [](/docs/design-docs/rules/impl-file-role-contract.md)
