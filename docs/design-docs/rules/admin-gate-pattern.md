---
title: AdminGate (Deferred Admin UI) Pattern
impact: CRITICAL
impactDescription: SSG のパフォーマンスを損なうことなく、静的な公開ページに管理機能を統合する。
tags: architecture, ssg, auth, hydration
chapter: Implementation
---

## AdminGate (Deferred Admin UI) Pattern

Next.js の `force-static`（完全静的生成）を維持しながら、ログイン済みの管理者に対してのみ編集 UI や機密データを動的に提供するためのパターン。

### Why it matters
公開ページの `dynamic = 'auto'` や `headers()` への依存は、ページ全体の静的最適化を解除してしまいます。AdminGate を使うことで、一般ユーザーには 100% 静的な HTML を返し、管理者のみが Hydration 後に API 経由で権限とデータを取得する「後載せ」の管理体験を実現できます。

**Incorrect:**

```tsx
// ページ全体を動的にしてしまう（SSGが効かない）
export default async function Page() {
  const isAdmin = await checkAuth(); // サーバーサイドでCookieを参照
  return (
    <main>
      {isAdmin && <Editor />}
      <PublicContent />
    </main>
  );
}
```

**Correct:**

```tsx
// ページは force-static のまま、クライアント側で「ゲート」を開く
export default function Page() {
  return (
    <main>
      <AdminGate>
        <DeferredEditor /> {/* 管理者判定後に API からデータを取って表示 */}
      </AdminGate>
      <PublicContent />
    </main>
  );
}
```
