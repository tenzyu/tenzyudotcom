---
title: Locale Switcher Single Flow
impact: HIGH
impactDescription: locale 永続化と遷移を二重化すると、ユーザー選択 locale が端末言語判定に負けることがある。
tags: i18n, locale, intlayer, proxy
chapter: Implementation
---

# Locale Switcher Single Flow

`next-intlayer` の `setLocale()` を使う locale 切り替えでは、同じ操作中に手動 `Link` 遷移を重ねない。切り替え処理は 1 つのフローに統一する。

### Why it matters

`setLocale()` は locale 永続化と遷移を担う。ここへ別の localized `Link` を同時に組み合わせると、端末やブラウザによっては永続化タイミングが不安定になり、次回の locale なしアクセスで `Accept-Language` が勝つことがある。

### Locale Precedence

1. URL に含まれる explicit locale
2. サイトが永続化した user-selected locale
3. `Accept-Language`
4. default locale

**Incorrect:**

```tsx
<Link href={localizedHref} onClick={() => setLocale(nextLocale)} />
```

**Correct:**

```tsx
<DropdownMenuItem
  onSelect={() => {
    startTransition(() => setLocale(nextLocale))
  }}
/>
```

`proxy.ts` 側にもこの優先順位をコメントで残し、回帰テストで固定する。
