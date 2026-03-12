---
title: Owner Placement Layers
impact: HIGH
impactDescription: 配置判断を ownership に揃え、shared の dumping ground 化を防ぐ。
tags: architecture, ownership, organization
chapter: Foundations
---

## Owner Placement Layers

配置は技術分類ではなく ownership で決める。  
この repo では `src/app` の owner tree を正本とし、top-level shared は例外として扱う。

**Avoid:**

```text
app owner を持つコードを、慣性で src/features や src/components へ置く
```

**Prefer:**

```text
1. src/app/**/_features
2. ancestor owner の src/app/**/_features
3. src/components/ui
4. src/components
5. src/config, src/lib
6. src/features は app tree で自然に置けない cross-branch shared のみ
```

