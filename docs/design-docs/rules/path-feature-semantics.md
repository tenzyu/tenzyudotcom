---
title: "Path & Feature Semantics"
impact: HIGH
impactDescription: ファイルパスを一意の識別子として使い、探索コストを最小化する。
tags: structure, organization, naming
chapter: Foundations
---

# Path & Feature Semantics

ディレクトリ名は「技術分類」よりも「機能属性」を優先する。

- **`_features/`**: ルート内スライス。
- **`components/`**, **`hooks/`**, **`lib/`**: これらはトップレベルではなく、feature ディレクトリの内部を整理するために使う。
- **Small Features Stay Flat**: ファイル数が 5 つ程度まではサブディレクトリを作らず、フラットに保つ。

**Incorrect:**

```text
// ファイルが少ないのに最初から lib/ や components/ フォルダを掘る
src/app/.../_features/
  ├── components/
  │   └── my-button.tsx
  └── lib/
      └── utils.ts
```

**Correct:**

```text
// まずはフラットに配置し、読み筋が分かれ始めてからフォルダを掘る
src/app/.../_features/
  ├── my-button.tsx
  └── utils.ts
```
