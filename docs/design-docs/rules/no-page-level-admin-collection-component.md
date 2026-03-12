---
title: No Page-Level Admin Collection Component
impact: HIGH
impactDescription: page-level の巨大 collection component で admin UI を解決すると、依存方向と保守性が壊れる。
tags: admin, architecture, dependency-inversion, maintainability
chapter: Implementation
---

# No Page-Level Admin Collection Component

inline admin を実装するとき、`*-collection.tsx` のような page-level 巨大 component を新設して表示・取得・保存・編集状態をまとめて解決しない。

### Why it matters

この形は public UI の責務と admin orchestration を 1 つへ混ぜやすく、`dependency-inversion` ルールに反する。結果として UI が data loading と persistence を所有し、leaf component 単位の差し込みが困難になる。

**Correct direction:**

- 既存 public component を基本的に維持する
- 三点リーダー component を leaf として差し込む
- tweet button のような追加導線も leaf component として差し込む
- `AdminGate` は差し込みたい最小範囲だけを囲う
- 取得・保存・整形は `domain / port / infra / assemble` へ押し下げる

**Incorrect:**

```tsx
// page 全体を client component 化し、public list と admin state をまとめる
export function NotesPageCollection() { ... }
```

**Preferred:**

```tsx
<NoteCard>
  <AdminGate>
    <NoteAdminMenu />
  </AdminGate>
</NoteCard>
```
