---
title: Use Proxy Instead of Middleware
impact: HIGH
impactDescription: Middleware は、Next.js 16 で推奨されていない。代わりに、Proxy を使用する。
tags: middleware, proxy
chapter: Implementation
---

## Use Proxy Instead of Middleware

このルールは `nextjs-16-proxy.md` の短縮版。  
repo 固有の詳細はそちらを正本とし、ここでは禁止事項だけを明記する。

**Incorrect:**

```tsx
export function middleware() { }
```

**Correct:**

```tsx
// src/proxy.ts を使う
```

References
- [nextjs-16-proxy.md](./nextjs-16-proxy.md)
