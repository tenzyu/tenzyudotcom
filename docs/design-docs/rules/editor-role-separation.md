---
title: "Editor Role Separation"
impact: MEDIUM
impactDescription: 文言の役割（メタデータ、見出し、本文、ナビ）を分離し、UX と SEO を両立させる。
tags: content, editor, seo
chapter: Intelligence
---

# Editor Role Separation

全ての文言を一律に扱わず、その露出場所と目的に応じて役割を分離する。

- **Metadata**: 検索・共有用。主題を優先し、詩的な表現を避ける。
- **Page Header**: 訪問者への導入。Metadata より expressive で良い。
- **Page Lead**: ページの内容を 1〜2 文で説明。Metadata Description を流用しない。
- **Nav/Tile**: 1 行で行き先を判断させる。Page Lead を流用しない。

**Incorrect:**

```text
// 検索結果用の Metadata Description を、ページ冒頭の導入文としてそのまま表示する
// ナビゲーションの短いラベルに、詳細な説明文を詰め込む
```

**Correct:**

```text
// ページを開く前（Nav）と開いた後（Lead）で、情報の粒度を適切に変える
// 検索エンジン向けの文言と、人間向けの表現を区別する
```
