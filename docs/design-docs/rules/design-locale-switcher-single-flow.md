---
title: Locale Switcher Single Flow
impact: HIGH
impactDescription: locale 永続化と遷移を二重化すると、ユーザー選択 locale が端末言語判定に負けることがある。
tags: i18n, locale, intlayer, proxy
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

