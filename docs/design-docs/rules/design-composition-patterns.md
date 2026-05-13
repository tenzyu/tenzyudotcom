---
title: "Composition Patterns"
impact: HIGH
impactDescription: プロップ・ドリリングを抑制し、RSC ペイロードを最小化することで、保守性とパフォーマンスを向上させる。
tags: react, composition, rsc
chapter: UI & UX
---

## Composition Patterns

トップレベルからの prop drilling を避け、`children` などの composition で責務を分ける。  
Server Components で取得したデータは、Client Components へ最小限だけ渡す。

**Avoid:**

```tsx
<ClientParent data={hugeData} />
```

**Prefer:**

```tsx
<ClientParent>
  <ServerChild data={neededPart} />
</ClientParent>
```

