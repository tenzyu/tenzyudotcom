---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.ui-ux.locale-switcher-single-flow
title: Locale Switcher Single Flow
status: active
tags:
  - i18n
  - locale
  - intlayer
  - proxy
  - subject:i18n
  - framework:intlayer
  - subject:proxy
  - kind:rule
  - criticality:high
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: locale 永続化と遷移を二重化すると、ユーザー選択 locale が端末言語判定に負けることがある。
    chapter: UI & UX
---

## Locale Switcher Single Flow

`next-intlayer` の `setLocale()` を使う locale 切り替えでは、同じ操作中に手動 `Link` 遷移を重ねない。  
切り替え処理は 1 つのフローに統一する。

**Avoid:**

```tsx
<Link href={localizedHref} onClick={() => setLocale(nextLocale)} />
```

**Prefer:**

```tsx
<DropdownMenuItem
  onSelect={() => {
    startTransition(() => setLocale(nextLocale))
  }}
/>
```
