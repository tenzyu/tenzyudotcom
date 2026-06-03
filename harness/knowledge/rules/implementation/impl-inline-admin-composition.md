---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.implementation.inline-admin-composition
title: Inline Admin Composition
status: active
tags:
  - admin
  - composition
  - ui
  - domain:site
  - subject:composition
  - subject:ui
  - kind:rule
  - criticality:high
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: public UI を保ったまま admin affordance を leaf へ差し込み、page-level wrapper 化を防ぐ。
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

;<AdminGate>
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
