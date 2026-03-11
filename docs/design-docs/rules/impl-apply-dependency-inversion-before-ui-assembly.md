---
title: Apply Dependency Inversion Before UI Assembly
impact: HIGH
impactDescription: UI コンポーネントの中へ取得・保存・整形を押し込むと、責務が壊れ、再利用も検証も難しくなる。
tags: architecture, dependency-inversion, ui
chapter: Implementation
---

## Apply Dependency Inversion Before UI Assembly

ユーザーの指摘どおり、今回の初期実装は `dependency-inversion` を適用せず、UI 側でデータ取得・保存・状態管理を抱え込みすぎていた。これはこの repo の設計ルールに反していた。

**Incorrect:**

```tsx
function LeafAdminMenu() {
  const [entries, setEntries] = useState(null)
  async function save() {
    const state = await fetch('/api/editor/notes')
    // mutate and save here
  }
}
```

**Correct:**

```tsx
// domain / port / contract / assemble で取得と保存の責務を整理し、
// UI は leaf affordance として最小限の入力状態だけを持つ
```
