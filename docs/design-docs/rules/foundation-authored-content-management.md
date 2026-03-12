---
title: Authored Content Management
impact: HIGH
impactDescription: code と人間が管理する content data を分離し、更新を deploy 依存にしない。
tags: content, storage, architecture
chapter: Foundations
---

## Authored Content Management

人間が随時更新する content は `src/` に埋め込まず、storage 層で管理する。  
`src/` には型、validation、assemble だけを置く。

**Avoid:**

```typescript
export const MY_LINKS = [
  { name: "X", url: "https://x.com/..." },
]
```

**Prefer:**

```typescript
export type MyLink = { name: string; url: string }

const { collection } = await editorRepository.loadState("links")
```

