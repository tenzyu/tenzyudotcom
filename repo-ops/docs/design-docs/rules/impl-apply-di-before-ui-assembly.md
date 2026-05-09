---
title: Apply DI Before UI Assembly
impact: HIGH
impactDescription: UI に取得・保存・整形を抱え込ませず、leaf affordance に閉じ込める。
tags: architecture, dependency-inversion, ui
chapter: Implementation
---

## Apply DI Before UI Assembly

UI assembly に入る前に dependency inversion を適用する。  
UI は leaf affordance と最小限の入力状態だけを持ち、取得・保存・整形の責務は別層へ出す。

**Avoid:**

```tsx
function LeafAdminMenu() {
  const [entries, setEntries] = useState(null)
  async function save() {
    const state = await fetch("/api/editor/notes")
    // mutate and save here
  }
}
```

**Prefer:**

```tsx
// domain / port / infra / assemble で取得と保存の責務を整理し、
// UI は leaf affordance として最小限の入力状態だけを持つ
```
