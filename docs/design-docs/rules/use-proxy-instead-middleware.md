---
title: Use Proxy Instead of Middleware
impact: HIGH
impactDescription: Middleware は、Next.js 16 で推奨されていない。代わりに、Proxy を使用する。
tags: middleware, proxy
chapter: Implementation
---

## Rule Title Here

Brief explanation of the rule and why it matters.

**Incorrect:**

```tsx
export function middleware() { }
```

**Correct:**

```tsx
import { multipleProxies, intlayerProxy } from "next-intlayer/proxy";
import { customProxy } from "@utils/customProxy";

export const proxy = multipleProxies([intlayerProxy, customProxy]);
```

References
- [Next.js 16 Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Intlayer multipleProxy](https://intlayer.org/doc/environment/nextjs#optional-step-7-configure-proxy-for-locale-detection)