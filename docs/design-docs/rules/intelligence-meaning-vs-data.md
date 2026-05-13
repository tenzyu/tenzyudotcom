---
title: "Meaning Vs Data Separation"
impact: HIGH
impactDescription: 識別子と翻訳文を分離し、データ更新と多言語化を疎結合にする。
tags: i18n, intlayer, data
chapter: Intelligence
---

## Meaning Vs Data Separation

国際化はテキスト置換ではなく、identifier と visible meaning の分離として扱う。

**Avoid:**

```typescript
export const content = {
  linkUrl: "https://example.com/id-123",
  linkLabel: "Click here",
}
```

**Prefer:**

```typescript
// item.source.ts -> { id, url }
// item.content.ts -> { label }
// *.assemble.ts -> source と content を結合
```
