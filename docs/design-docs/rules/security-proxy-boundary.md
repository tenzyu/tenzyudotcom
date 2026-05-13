---
title: Proxy Boundary
impact: HIGH
impactDescription: "`proxy.ts` を薄い入口に保ち、重い検証は server 側へ残して静的最適化と安全性を両立する。"
tags: security, proxy, nextjs, performance
chapter: Security & Safety
---

## Proxy Boundary

Next.js 16 では `middleware.ts` ではなく `proxy.ts` を使う。  
proxy 層は情報の存在確認と付与だけに留め、重い検証や外部 I/O を持ち込まない。

**Avoid:**

```tsx
// src/middleware.ts
export function middleware() {}

export function proxy(request: NextRequest) {
  if (!verifyHmac(request.cookies.get("session"), SECRET)) {
    return NextResponse.redirect("/login")
  }
}
```

**Prefer:**

```tsx
import { intlayerProxy } from "next-intlayer/proxy"

export function proxy(request: NextRequest) {
  const response = intlayerProxy(request)
  response.headers.set("x-pathname", request.nextUrl.pathname)
  return response
}

export async function hasValidSession() {
  const h = await headers()
  const token = (await cookies()).get("session_token")
  return verifyHmac(token, SECRET)
}
```
