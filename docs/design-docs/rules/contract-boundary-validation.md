---
title: "Contract & Boundary Validation"
impact: HIGH
impactDescription: 外部からの不明なデータによるランタイムエラーを防ぎ、型安全性を確保する。
tags: validation, boundary, zod
chapter: Implementation
---

# Contract & Boundary Validation

外部 API、MDX の Frontmatter、URL 検索パラメータなどの境界（Boundary）で受け取るデータは、必ず Zod 等のスキーマバリデーションを通して検証し、型を確定（正規化）させる。

**Parse, don't validate**: データをチェックするだけでなく、信頼できる形状へ変換してから内部へ流す。

**Incorrect:**

```tsx
// 外部からの JSON をそのままキャストして使う
const data = await res.json() as UnsafeType;
```

**Correct:**

```tsx
// Zod スキーマでパースし、型安全な形状を保証する
const data = MySchema.parse(await res.json());
```
