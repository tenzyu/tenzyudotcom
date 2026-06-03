---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.ui-ux.composition-patterns
title: Composition Patterns
status: active
tags:
  - react
  - composition
  - rsc
  - framework:react
  - subject:composition
  - kind:rule
  - criticality:high
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: プロップ・ドリリングを抑制し、RSC ペイロードを最小化することで、保守性とパフォーマンスを向上させる。
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
