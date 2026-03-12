---
title: Inline Admin Composition
impact: HIGH
impactDescription: public UI を保ったまま admin affordance を leaf へ差し込み、page-level wrapper 化を防ぐ。
tags: admin, composition, ui
chapter: Implementation
---

## Inline Admin Composition

inline admin は page 全体を wrapper 化せず、既存 public UI に leaf affordance を重ねる。

**Avoid:**

```tsx
export function NotesPageCollection() {
  // public list
  // admin fetch
  // save
  // edit dialog
}

<AdminGate>
  <LargeAdminAreaForWholePage />
</AdminGate>
```

**Prefer:**

```tsx
<OriginalTile />
<AdminGate>
  <TileAdminMenu />
</AdminGate>

<NoteCard>
  <AdminGate>
    <NoteAdminMenu />
  </AdminGate>
</NoteCard>
```

