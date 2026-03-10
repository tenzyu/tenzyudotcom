---
title: "Security: Env Parsing & Centralization"
impact: CRITICAL
impactDescription: ブラウザへの機密情報の漏洩を防ぎ、すべての環境変数の型安全性を確保する。
tags: security, environment, env-contract
chapter: Security & Safety
---

# Security: Env Parsing & Centralization

環境変数は `src/config/` 内の `env.contract.ts` などで一括してパース・検証を行う。
`process.env` を複数ファイルから直接参照することを禁止し、機密情報の露出を最小化する。

- **接頭辞 `NEXT_PUBLIC_`**: クライアント側（ブラウザ）に露出しても安全なもの。
- **それ以外**: サーバーサイドでのみ使用する機密情報。

**Incorrect:**

```tsx
// 複数のファイルで process.env を直接呼び出し、型も不明
const apiKey = process.env.API_KEY;
```

**Correct:**

```tsx
// env.contract.ts で一括管理し、型安全なオブジェクトをインポートする
import { env } from "@/config/env.contract";
```
