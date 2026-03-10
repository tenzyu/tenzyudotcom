---
title: "Composition Patterns"
impact: HIGH
impactDescription: プロップ・ドリリングを抑制し、RSC ペイロードを最小化することで、保守性とパフォーマンスを向上させる。
tags: react, composition, rsc
chapter: Implementation
---

# Composition Patterns

トップレベルからのプロップ・ドリリング（Prop Drilling）を防ぐため、`children` props などを活用したコンポジションを推奨する。
Server Components でデータを取得し、Client Components にはシリアライズ可能な最小限のデータのみを渡すように設計する。

**Incorrect:**

```tsx
// Client Component に巨大なオブジェクト全体を渡してバケツリレーする
<ClientParent data={hugeData} />
```

**Correct:**

```tsx
// Server Component で子要素を組み立て、children として渡す
<ClientParent>
  <ServerChild data={neededPart} />
</ClientParent>
```
