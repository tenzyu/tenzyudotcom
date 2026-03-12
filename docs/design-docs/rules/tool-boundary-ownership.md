---
title: "Tool Boundary & Ownership"
impact: HIGH
impactDescription: ツールの責務を明確にし、密結合による交換不可能性を防ぐ。
tags: tools, boundaries, dependency
chapter: Foundations
---

# Tool Boundary & Ownership

それぞれの道具が担当する境界を厳守する。

| Concern | Owner | Must NOT become |
| :--- | :--- | :--- |
| Localized meaning | Intlayer | fetch input registry / database |
| Base UI | shadcn/ui | domain-aware features |
| Presentation primitive | `src/components` | app-owned workflow / data logic |
| App-owned feature | `src/app/**/_features` | generic presentation library |
| Cross-branch shared | `src/features` | default dumping ground |

## Repo-specific Notes

- `src/components` は owner tree を持つ app logic を持たない
- `src/features` は app owner tree で置けない shared のみ
- `src/config` と `src/lib` は feature owner を持たない global / low-level concern を扱う

## Incorrect

```text
presentation primitive に app-owned interest を混ぜる
```

## Correct

```text
primitive は primitive のまま残し、app-owned interest は owner tree へ置く
```
