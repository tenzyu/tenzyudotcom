---
title: AdminGate Is Stable Contract
impact: HIGH
impactDescription: 認可 UI の基準コンポーネントをタスク都合で変更すると、security と hydration の前提が崩れる。
tags: admin, security, auth, stable-boundary
chapter: Implementation
---

# AdminGate Is Stable Contract

`src/app/[locale]/(main)/_features/admin/admin-gate.tsx` は security-sensitive な基準コンポーネントとして扱い、明示依頼なしに挙動を変更しない。

### Why it matters

`AdminGate` は `/api/auth/me` を使ったクライアント側 admin 判定の標準実装であり、hydration と認可 UX の前提を持つ。個別タスクの都合でキャッシュ戦略や状態表現を変えると、未レビューの security 変更になる。

**Required:**

- 既存の `AdminGate` を尊守する
- admin affordance は `AdminGate` の内側へ小さく差し込む
- 認可キャッシュや判定戦略を変えるときは、専用 task と review 前提で扱う

**Forbidden:**

- task 遂行のために `AdminGate` の内部実装を勝手に書き換える
- page-level の都合で auth status cache を持ち込む
- 認可責務と UI 便利機能を混ぜる
