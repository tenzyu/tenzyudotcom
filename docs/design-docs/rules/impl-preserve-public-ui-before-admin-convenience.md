---
title: Preserve Public UI Before Admin Convenience
impact: MEDIUM
impactDescription: admin 実装の都合で public UI を崩すと、ユーザー価値の高い基底体験を損なう。
tags: ui, ux, composition
chapter: Implementation
---

## Preserve Public UI Before Admin Convenience

`/links` を元の avatar tile UI から別物の card UI にしてしまったのは誤りだった。admin の都合より public UI の連続性を優先すべき、という指摘は正しかった。

**Incorrect:**

```tsx
// 元の ItemGroup UI を捨てて、admin 都合で別の card list に差し替える
```

**Correct:**

```tsx
// public UI を維持したまま、leaf admin menu だけを重ねる
<OriginalTile />
<AdminGate>
  <TileAdminMenu />
</AdminGate>
```
