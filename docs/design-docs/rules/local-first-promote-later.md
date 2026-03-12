---
title: "Local-first, Promote-later"
impact: HIGH
impactDescription: 早期の抽象化を防ぎ、機能の独立性を高めることで変更の波及を抑える。
tags: architecture, organization
chapter: Foundations
---

# Local-first, Promote-later

再利用の「可能性」ではなく、実際の import 事実に基づいて promote する。  
まずは最も近い owner に置き、複数 owner から参照されたら least common owner に上げる。

## Repo-specific Rule

- default promote 先は `src/features` ではなく `src/app` の ancestor owner
- `src/features` は app tree で自然に置けない cross-branch shared のみ
- `lint-symbol-ownership` の `targetOwner` を promote / demote の基準にする

## Incorrect

```text
再利用されるかもしれない、という理由だけで最初から src/features や src/components に置く
```

## Correct

```text
まず owner tree の最も近い位置に置き、shared になった時だけ least common owner へ promote する
```
