---
title: Editor Collection Registration
impact: HIGH
impactDescription: editor collection 追加時の registry 漏れを防ぎ、admin editor の読込経路を壊さない。
tags: editor, contracts, admin
chapter: Implementation
---

## Editor Collection Registration

新しい editor collection を追加するときは、descriptor だけで終わらせず registry と path mapping まで揃える。

**Avoid:**

```tsx
export const TOOLS_COLLECTION_DESCRIPTOR = {
  id: "tools",
}
```

**Prefer:**

```tsx
export const EDITOR_COLLECTIONS = {
  tools: TOOLS_COLLECTION_DESCRIPTOR,
}
```
