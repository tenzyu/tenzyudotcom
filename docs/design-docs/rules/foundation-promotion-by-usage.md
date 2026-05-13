---
title: Promotion By Usage
impact: HIGH
impactDescription: 再利用の事実に基づいて promote し、早すぎる抽象化を防ぐ。
tags: architecture, ownership
chapter: Foundations
---

## Promotion By Usage

再利用の「可能性」ではなく、実際の import 事実を基準に promote する。  
まず最も近い owner に置き、複数 owner から使われた時だけ least common owner に上げる。

**Avoid:**

```text
再利用されるかもしれない、という理由だけで最初から src/features や src/components に置く
```

**Prefer:**

```text
default promote 先は src/features ではなく src/app の ancestor owner
lint-symbol-ownership の targetOwner を promote / demote の基準に使う
```

