---
title: "Security: Explicit Env Parsing & Centralization"
impact: CRITICAL
impactDescription: ブラウザへの機密情報の漏洩を防ぎ、すべての環境変数の型安全性を確保する。
tags: security, environment, env-infra
chapter: Security & Safety
---

# Security: Explicit Env Parsing & Centralization

外部ライブラリ（Vercel Blob, YouTube API 等）を呼び出す際、ライブラリ内部の暗黙的な環境変数参照（`process.env`）に頼らず、Infrastructure 層（`infra`）において `src/config/env.infra.ts` からパース済みの値を明示的に渡す。

`process.env` を複数ファイルから直接参照することを禁止し、機密情報の露出を最小化する。

- **接頭辞 `NEXT_PUBLIC_`**: クライアント側（ブラウザ）に露出しても安全なもの。
- **それ以外**: サーバーサイドでのみ使用する機密情報。

**Avoid:**

```tsx
// 複数のファイルで process.env を直接呼び出し、型も不明
const apiKey = process.env.API_KEY;
```

**Prefer:**

```tsx
// env.infra.ts で一括管理し、型安全なオブジェクトをインポートする
import { env } from "@/config/env.infra";
```
