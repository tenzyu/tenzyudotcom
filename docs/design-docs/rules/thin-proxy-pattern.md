---
title: "Security: Thin Proxy Pattern"
impact: HIGH
impactDescription: パフォーマンス（爆速な遷移）と安全性（厳格な検証）を両立させるための役割分担を定義する。
tags: security, middleware, proxy, performance
chapter: Security & Safety
---

# Security: Thin Proxy Pattern

Next.js の `proxy.ts` (旧 Middleware) と Server Components 間の役割分担を最適化し、ユーザー体験と堅牢性を両立させる。

## Principles

1.  **Thin Proxy (Middleware層)**: 
    *   **役割**: 高速な交通整理とコンテキストの付与。
    *   **処理**: Cookie の「存在確認」や `x-pathname` の付与など、外部 I/O や重い計算（HMAC検証等）を伴わない軽量な処理のみを行う。
    *   **理由**: エッジでの実行速度を最大化し、すべてのリクエストに対するオーバーヘッドを最小限に抑えるため。

2.  **Strict Validation (Server Components層)**:
    *   **役割**: データの保護と正当性の最終確認。
    *   **処理**: `headers()` を呼び出した上での HMAC 署名検証や、必要に応じた DB 照会を行う。
    *   **理由**: `headers()` の呼び出しにより Dynamic Rendering を強制し、キャッシュによる認可バイパスを防ぐとともに、改ざんされた Cookie を確実に排除するため。

## Implementation

**Incorrect:**

```tsx
// proxy.ts で重い署名検証を行う
export function proxy(request: NextRequest) {
  const token = request.cookies.get('session');
  if (!verifyHmac(token, SECRET)) { // 低速
    return NextResponse.redirect('/login');
  }
  return NextResponse.next();
}
```

**Correct:**

```tsx
// proxy.ts (Middleware)
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  // Cookieの有無だけ見て、詳細は SC に任せる
  return response;
}

// Server Component / Logic
export async function hasValidSession() {
  const h = await headers(); // Dynamic Rendering を強制
  const token = (await cookies()).get('session');
  return verifyHmac(token, SECRET); // ここで厳密に検証
}
```

Reference: [【Next.js】BetterAuth ログイン後の遷移を爆速にする「Thin Proxy」パターン](https://qiita.com/HakamataSoft/items/288fe1cfe03140af9178)
