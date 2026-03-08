---
name: harness
description: Entry point for the repo's agent harness. Read this first to decide which harness documents to load for architecture, structure, safety, tools, memory, and known-gap questions.
user-invocable: false
---

# Harness

このディレクトリは、このプロジェクトで LLM を AI エージェントとして運用するための
判断基準を定義する。

現状コードの説明ではなく、repo が収束すべき target architecture を扱う。

## First Read

新しい task を始めるときは、まずこの `README.md` を読む。
その後は task に必要な文書だけを読む。

迷ったら次の順で読む。

1. `references/context.md`
2. `references/structure.md`
3. `references/guard.md`
4. `references/tools.md`
5. `references/memory.md`
6. `known-gaps.md`

通常の実装や refactor では
`context -> structure -> guard`
までで足りる。

harness 自体の review や extension では
`known-gaps.md` も確認する。

## Routing

| Need | Read |
| --- | --- |
| 原理の優先順位を決めたい | `references/context.md` |
| file placement を決めたい | `references/structure.md` |
| unsafe な変更を避けたい | `references/guard.md` |
| Intlayer / tool / dependency の境界を決めたい | `references/tools.md` |
| docs に何を残すか決めたい | `references/memory.md` |
| まだ定義されていない論点を確認したい | `known-gaps.md` |

典型の組み合わせ:

- 新規実装
  - `context -> structure -> guard`
- 配置変更、promote、demote、rename
  - `structure -> guard`
- 設計批評、妥当性評価
  - `context -> structure`
- Intlayer / data / src/lib / src/config の置き分け
  - `structure -> tools`
- docs 更新や durable memory の整理
  - `memory`
- harness の review / extension / gap 整理
  - `context -> structure -> guard -> known-gaps`

## Core Rule

この repo の基本原則は `local-first, promote-later` である。

補助原理:

- `Feature-first, Pattern-later`
- `Workflow-aligned, Not Syntax-aligned`
- `Proximity-driven, Overhead-minimal`
- `Attribute-priority, Discovery-oriented`
- vendor-like primitive は anchored のまま扱う
  - 例: shadcn/ui は `src/components/ui` から移動しない

原理の優先順位は `context.md`、
placement の具体は `structure.md`、
安全制約は `guard.md`、
tool boundary は `tools.md` が担当する。

## Harness Review

ハーネス自体を更新した場合は、更新後に次を review する。

- LLM にとって重要な判断情報が、1 か所で読める単位にまとまっているか
- 同じ判断軸について、複数文書が競合する思想を出していないか
- route / feature / contract / tool boundary が別名で二重定義されていないか
- README から辿れる routing になっているか
- known gaps が README から辿れるか

## Loop Discipline

改善 loop では、project 改善だけでなく
ハーネス自身の readability / non-conflict も毎回 review 対象に含める。

また、同じ観点だけで loop し続けない。
次の loop では、直前とは異なる観点を 1 つ主軸に選ぶ。

方向性が不明で、user の価値観や運用思想が structural decision に効く場合は、
推測で進めず短いインタビューを先に行う。

- ownership / placement
- verification / testability
- runtime boundary / contract
- security / outbound boundary
- data freshness / caching
- config / policy / sanctioned exception
- UX / content / accessibility
- performance / bundle / discovery
- tooling / developer workflow
