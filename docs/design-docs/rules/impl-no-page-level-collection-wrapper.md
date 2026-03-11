---
title: No Page-Level Collection Wrapper
impact: HIGH
impactDescription: "`*-collection.tsx` のような巨大 wrapper は public UI と admin orchestration を混ぜ、保守性を悪化させる。"
tags: architecture, maintainability, admin
chapter: Implementation
---

## No Page-Level Collection Wrapper

`notes-page-collection.tsx` や `links-page-collection.tsx` のように、ページ全体を client wrapper で包んで admin 体験を解決しようとしたのは誤りだった。公開 UI の責務と admin の取得・保存・編集状態を 1 つへ混ぜてしまうからだ。

**Incorrect:**

```tsx
export function LinksPageCollection() {
  // page 全体の表示
  // admin fetch
  // save
  // edit dialog
}
```

**Correct:**

```text
Read: [Use Dependency Inversion](/design-docs/rules/dependency-inversion.md)
```
