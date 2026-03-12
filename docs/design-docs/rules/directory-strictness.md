---
title: "Directory Strictness"
impact: HIGH
impactDescription: 構造を「技術分類」ではなく「変更責務（所有権）」で分けることで、影響範囲を自明にする。
tags: structure, ownership
chapter: Foundations
---

# Directory Strictness

配置先は技術分類より ownership を優先する。  
このルールは top-level directory の意味だけを定義し、promote/demote の判断自体は `ownership-model-layers` と `local-first-promote-later` に委譲する。

## Top-level Meanings

1. `src/app`: app owner tree の正本
2. `src/components/ui`: vendor UI
3. `src/components`: presentation primitive
4. `src/config`: site-wide config
5. `src/lib`: low-level helper / infra substrate
6. `src/features`: app owner tree で自然に置けない shared のみ

## Incorrect

```text
app owner を持つコードを、慣性で src/features や src/components へ置く
```

## Correct

```text
まず src/app owner tree に置き、presentation primitive や global helper だけを top-level shared へ出す
```
