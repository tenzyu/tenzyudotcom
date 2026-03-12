---
title: No Re-export Repair Guide
impact: MEDIUM
impactDescription: lint-no-reexport の意図を短く伝え、修正時に中継ファイルを増やさないようにする。
tags: reference, lint, exports
chapter: References
---

## No Re-export Repair Guide

`lint-no-reexport` が落ちたら、barrel file を足すのではなく、利用側が source module を直接 import する形へ戻す。

**Check:**

```text
export { ... } from "./x" だけの file になっていないか
その file が探索性ではなく import の省略だけを目的にしていないか
```

**Read Next:**

- [](/docs/design-docs/rules/foundation-tool-boundaries.md)
- [](/docs/design-docs/rules/foundation-feature-slice-structure.md)
