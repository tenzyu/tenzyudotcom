---
title: Editor Collection Registration Contract
impact: HIGH
impactDescription: editor collection の追加漏れは admin editor の読込と再検証を壊す
tags: editor, contracts, admin
chapter: Implementation
---

## Editor Collection Registration Contract

新しい editor collection を追加するときは、schema や UI だけで終わらせず、descriptor と registry と path mapping まで揃える。collection 追加は単一ファイル作成では完結しない。

**Incorrect:**

```tsx
// descriptor を作っただけで registry や publicPaths を更新しない
export const TOOLS_COLLECTION_DESCRIPTOR = {
  id: 'tools',
}
```

**Correct:**

```tsx
// collection 追加時は descriptor, registry, publicPaths, path mapping を揃える
export const EDITOR_COLLECTIONS = {
  tools: TOOLS_COLLECTION_DESCRIPTOR,
}
```
