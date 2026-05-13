---
title: "Content Role Separation"
impact: MEDIUM
impactDescription: 文言の役割を分離し、SEO と UX の両方で適切な粒度を保つ。
tags: content, editor, seo
chapter: Intelligence
---

## Content Role Separation

文言は metadata、header、lead、nav で同じものを使い回さない。  
露出場所ごとに役割を分ける。

**Avoid:**

```text
metadata description を page lead としてそのまま再利用する
nav label に長い説明文を流し込む
```

**Prefer:**

```text
metadata: 検索・共有用
header: 訪問者への導入
lead: ページ内容の短い説明
nav/tile: 行き先判断のための短いラベル
```

