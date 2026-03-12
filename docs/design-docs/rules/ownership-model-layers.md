---
title: "Ownership Model Layers"
impact: HIGH
impactDescription: コード配置を src/app の owner tree と少数の例外層へ収束させ、 dumping ground を防ぐ。
tags: architecture, ownership, organization
chapter: Foundations
---

# Ownership Model Layers

配置は構文ではなく ownership で決める。  
この repo では `src/app` の directory tree を ownership の正本とし、shared 層は例外扱いにする。

## Canonical Layers

1. `src/app/**/_features`
2. ancestor owner の `src/app/**/_features`
3. `src/components/ui`
4. `src/components` の presentation primitive
5. `src/config`, `src/lib`
6. `src/features` は app owner tree で自然に表現できない cross-branch shared のみ
7. `storage/` は authored content

## Repo-specific Placement Rules

- `src/app` 配下で閉じる関心事は、まず owner tree 内に置く
- `src/features` は default promote 先ではない
- `src/components` は他サイトへ持ち運べる presentation primitive を優先する
- `src/config` は site-wide policy、`src/lib` は low-level helper / infra substrate を置く

## See Also

- `local-first-promote-later.md`
- `directory-strictness.md`
- `decision-priority-order.md`
