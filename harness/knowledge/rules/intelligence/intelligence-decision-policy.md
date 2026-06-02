---
title: "Decision Policy"
impact: HIGH
impactDescription: 優先順位と target architecture を同時に固定し、現状追認による判断ブレを防ぐ。
tags: architecture, decision, strategy
chapter: Intelligence
---

## Decision Policy

設計判断は current code の追認ではなく、target architecture に寄せる前提で行う。  
そのうえで優先順位は owner tree から順に見る。

**Avoid:**

```text
既存の悪い前例に合わせて target のほうを書き換える
構文の美しさを優先して owner tree や import facts を崩す
将来の再利用を予想して最初から shared に置く
```

**Prefer:**

```text
現状のズレは負債として扱う
一度で直し切れなくても変更のたびに target へ寄せる

1. owner tree
2. import facts
3. shared class
4. workflow and proximity
5. pattern
```
