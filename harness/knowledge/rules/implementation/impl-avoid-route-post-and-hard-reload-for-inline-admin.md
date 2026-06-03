---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.implementation.avoid-route-post-and-hard-reload-for-inline-admin
title: Avoid Route POST And Hard Reload For Inline Admin
status: active
tags:
  - ux
  - routing
  - admin
  - subject:ux
  - subject:routing
  - domain:site
  - kind:rule
  - criticality:medium
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: inline admin で route POST や `window.location.reload()` を使うと、一瞬のエラーフラッシュや体験悪化を招く。
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
