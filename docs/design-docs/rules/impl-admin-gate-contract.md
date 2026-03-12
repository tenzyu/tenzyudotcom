---
title: Admin Gate Contract
impact: CRITICAL
impactDescription: Admin UI の認可境界を安定させ、個別タスク都合の変更で security と hydration を壊さない。
tags: admin, security, auth, hydration
chapter: Implementation
---

## Admin Gate Contract

`AdminGate` は静的な公開ページへ admin UI を後載せするための基準コンポーネントとして扱う。  
個別タスクの都合で内部実装や判定戦略を変えない。

**Avoid:**

```tsx
export default async function Page() {
  const isAdmin = await checkAuth()
  return <main>{isAdmin && <Editor />}</main>
}

export function AdminGate() {
  // task を進めるためだけに new auth cache / new control flow を入れる
}
```

**Prefer:**

```tsx
export default function Page() {
  return (
    <main>
      <AdminGate>
        <DeferredAdminUI />
      </AdminGate>
      <PublicContent />
    </main>
  )
}
```

