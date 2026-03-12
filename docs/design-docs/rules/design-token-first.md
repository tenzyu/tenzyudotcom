---
title: "Token-first Styling"
impact: HIGH
impactDescription: デザインの一貫性を保ち、マジックナンバーによる保守性の低下を防ぐ。
tags: design, css, tailwind
chapter: UI & UX
---

# Token-first Styling

全てのスタイリングは TailwindCSS のユーティリティクラス（トークン）を用いて行う。コンポーネントに直接 `px` 単位の数値をハードコードしたり、場当たり的な色を指定することを禁止する。

- **HSLベース**: 調和の取れたカラーパレットを使用する。
- **shadcn/ui**: 基盤コンポーネントのバリアントを再利用する。

**Avoid:**

```tsx
// マジックナンバーやハードコードされた色
<div style={{ padding: '13px', color: '#ff0000' }}>
```

**Prefer:**

```tsx
// トークン（Tailwind クラス）を使用
<div className="p-3 text-destructive">
```
