---
title: Avoid Route POST And Hard Reload For Inline Admin
impact: MEDIUM
impactDescription: inline admin で route POST や `window.location.reload()` を使うと、一瞬のエラーフラッシュや体験悪化を招く。
tags: ux, routing, admin
chapter: Implementation
---

## Avoid Route POST And Hard Reload For Inline Admin

`/links` で起きた一瞬のエラーページ表示は、client から server action を直接呼んだことで `POST /links` が発生していたのが原因だった。`window.location.reload()` も体験を悪くしていた。

**Avoid:**

```tsx
await saveInlineEditorCollectionAction(...)
window.location.reload()
```

**Prefer:**

```tsx
const result = await saveEditorCollection('links', sourceJson, version)
if (result.ok) {
  router.refresh()
}
```
