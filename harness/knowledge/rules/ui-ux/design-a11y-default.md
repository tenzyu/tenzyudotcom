---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.ui-ux.a11y-default
title: Accessibility by Default
status: active
tags:
  - a11y
  - html
  - seo
  - subject:a11y
  - framework:html
  - subject:seo
  - kind:rule
  - criticality:medium
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: 全てのユーザーが利用可能で、かつ検証しやすい UI 構造を維持する。
    chapter: UI & UX
---

# Accessibility by Default

Semantic HTML を遵守し、WAI-ARIA ガイドラインに従う。見た目のためだけの `div` 多用を避け、スクリーンリーダーやキーボード操作に対応させる。

**Avoid:**

```tsx
// 意味のない div の羅列。ボタンなのにクリックイベントを div に付ける
<div onClick={...}>Click me</div>
```

**Prefer:**
- **Semantic Elements**: `header`, `nav`, `main`, `article`, `section`, `footer` を適切に使い分ける。
- **Unique IDs**: インタラクティブ要素にはブラウザテストのための説明的な ID を付与する。

```tsx
// セマンティックな HTML。ボタン要素を使い、アクセシビリティを確保
<button id="submit-button" onClick={...}>Submit</button>
```
