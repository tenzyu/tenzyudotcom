---
title: Next.js 16 Proxy Convention
impact: MEDIUM
impactDescription: Middleware から Proxy への名称変更と、ヘッダー伝播の最適化。
tags: nextjs, middleware, proxy, convention
chapter: Implementation
---

## Next.js 16 Proxy Convention

Next.js 16 以降、従来の `middleware.ts` は `proxy.ts` へ名称変更され、役割がより明確化された。

### Key Implementation Points
- **ファイル名**: `src/proxy.ts` またはルートの `proxy.ts`。
- **ヘッダーの伝播**: `intlayerProxy` 等の既存プロキシと共存させる場合、返却される `Response` オブジェクトに対してヘッダーを付与する必要がある。
- **Thin Proxy**: プロキシ層では重い計算や I/O を避け、情報の「存在確認」や「付与」に徹する。

**Incorrect:**

```tsx
// 古い規約
// src/middleware.ts
export function middleware(req) { ... }
```

**Correct:**

```tsx
// 新しい規約
// src/proxy.ts
import { intlayerProxy } from 'next-intlayer/proxy'

export function proxy(request: NextRequest) {
  const response = intlayerProxy(request);
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}

export default proxy;
```

Reference: [Next.js Documentation - Proxy](https://nextjs.org/docs/app/getting-started/proxy)
