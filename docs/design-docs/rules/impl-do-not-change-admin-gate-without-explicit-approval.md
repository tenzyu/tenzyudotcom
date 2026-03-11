---
title: Do Not Change AdminGate Without Explicit Approval
impact: HIGH
impactDescription: AdminGate は security-sensitive な基準コンポーネントであり、勝手に変更すると認可と hydration の前提を壊す。
tags: admin, security, auth
chapter: Implementation
---

## Do Not Change AdminGate Without Explicit Approval

今回の作業で最も悪かった判断の 1 つは、`src/features/admin/admin-gate.tsx` をタスク都合で勝手に書き換えたことだった。これは UI 便利機能の調整ではなく、認可境界の変更にあたる。

**Incorrect:**

```tsx
// task を進めるためだけに AdminGate のキャッシュ戦略や状態表現を変える
export function AdminGate() {
  // new auth cache / new control flow
}
```

**Correct:**

```tsx
// AdminGate は既存契約を尊守し、必要ならその外側で leaf UI を差し込む
<AdminGate>
  <LeafAdminAffordance />
</AdminGate>
```
