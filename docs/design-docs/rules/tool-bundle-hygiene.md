---
title: "Bundle & Discovery Hygiene"
impact: HIGH
impactDescription: バンドルサイズの肥大化を防ぎ、コードの所有権を明示的にする。
tags: bundle, performance, import
chapter: Implementation
---

# Bundle & Discovery Hygiene

内部コードの Barrel Import（`index.ts` による一括エクスポート）は原則禁止とする。

- **Explicit Import**: 具体的なファイル名を指定してインポートし、探索経路を縮める。
- **No index.ts**: 同一ディレクトリ内であっても `./lib` のような省略インポートを避け、所有権を可視化する。

**Incorrect:**

```typescript
// 内部ファイルを index.ts でまとめてエクスポートし、他から一括インポートする
import { a, b, c } from "@/features/notes"; // 全ての依存が読み込まれるリスク
```

**Correct:**

```typescript
// 必要なファイルのみを直接指定してインポートする
import { a } from "@/features/notes/components/a";
```
