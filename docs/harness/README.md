---
name: harness
description: Entry point for the repo's agent harness. Read this first to decide which harness documents to load for architecture, structure, safety, tools, and memory questions.
user-invocable: false
---

# Harness

このディレクトリは、このプロジェクトで LLM を AI エージェントとして運用するための
ハーネスを定義する。

この文書群は現状コードの説明ではなく、repo が収束すべき
target architecture を定義する。

## When to Apply

この `README.md` は毎回の入口として使う。

- 新しい task を始めるとき
- どの harness 文書を読むべきか迷うとき
- 実装、review、refactor、設計批評のどれであっても最初に routing が必要なとき

## Workflow

最初に読むのは常にこの `README.md` でよい。
その後は、依頼の種類に応じて必要な md だけを読む。

迷ったら、次の順で読む。

1. `references/context.md`
2. `references/structure.md`
3. `references/guard.md`
4. `references/tools.md`
5. `references/memory.md`

通常の実装や refactor では
`references/context.md -> references/structure.md -> references/guard.md`
まで読めば足りる。

ハーネス自体を更新した場合は、更新後に次の review を追加で行う。

- LLM にとって重要な判断情報が、1 か所で読める単位にまとまっているか
- 同じ判断軸について、複数文書が競合する思想を出していないか
- route / feature / contract / tool boundary のどれかが別名で二重定義されていないか
- update した rule が、次回の task で実際に参照できる routing になっているか

## Quick Routing

| Need | Read |
| --- | --- |
| 原理の優先順位を知りたい | `references/context.md` |
| file をどこに置くか決めたい | `references/structure.md` |
| unsafe な変更を避けたい | `references/guard.md` |
| tool や library の責務を決めたい | `references/tools.md` |
| docs に何を残すか決めたい | `references/memory.md` |

## When to Read Which File

### Read `references/context.md` when

- 依頼が architecture review、方針評価、設計批評である
- どの原理を優先すべきか迷っている
- 現状コードより target architecture を優先してよいか確認したい

### Read `references/structure.md` when

- file を新規作成する
- file を移動、rename、promote、demote する
- shared と local の境界を決める
- Intlayer に入れるか `data` に置くか迷う
- `components`, `hooks`, `lib`, `data` の切り方を決める

### Read `references/guard.md` when

- 変更を実行する前に unsafe な操作がないか確認したい
- 大きな refactor や directory 再編を始める
- review や監査として問題点を洗い出す
- 最終報告で何を明示すべきか確認したい

### Read `references/tools.md` when

- どの tool や library に責務を持たせるか決める
- Intlayer、search/edit tool、git inspection の扱いを確認したい
- model-specific な足場に依存しすぎていないか見たい

### Read `references/memory.md` when

- 何を durable な設計知識として残すべきか決める
- 一時的な作業メモと repo memory を分けたい
- docs に残すべきことと残すべきでないことを見分けたい

## Auto-Load Heuristics

ユーザーが明示しなくても、次のきっかけがあれば自動で該当 md を読む。

- 「追加する」「移動する」「整理する」「切り出す」「共有化する」
  - `references/structure.md` と `references/guard.md`
- 「この設計は妥当か」「どの原理を優先すべきか」
  - `references/context.md` と必要に応じて `references/structure.md`
- 「Intlayer か data か」「src/lib に置くべきか」
  - `references/structure.md` と `references/tools.md`
- 「page.tsx の責務を決めたい」「route entry を薄くしたい」
  - `references/structure.md` と `references/guard.md`
- 「安全に進めたい」「どこまでやってよいか」
  - `references/guard.md`
- 「これは記憶すべきか」「docs に残すべきか」
  - `references/memory.md`

## Load Combinations

よくある依頼では、次の組み合わせで読む。

- 新規実装
  - `references/context.md` -> `references/structure.md` -> `references/guard.md`
- 配置変更、promote、demote、rename
  - `references/structure.md` -> `references/guard.md`
- 設計批評、妥当性評価
  - `references/context.md` -> `references/structure.md`
- Intlayer / data / src/lib の置き分け
  - `references/structure.md` -> `references/tools.md`
- `page.tsx` / `generateMetadata` の責務整理
  - `references/structure.md` -> `references/guard.md`
- docs 更新や durable memory の整理
  - `references/memory.md`

## Operating Principle

この repo における基本原則は `local-first, promote-later` である。
補助原理として、次を使う。

- `Feature-first, Pattern-later`
- `Workflow-aligned, Not Syntax-aligned`
- `Proximity-driven, Overhead-minimal`
- `Attribute-priority, Discovery-oriented`

ただし、これらの定義や優先順位は `references/context.md` に置く。
placement の具体は `references/structure.md` に置く。

ハーネス改善ループでは、project の改善だけでなく、
ハーネス更新そのものの readability / non-conflict も毎回 review 対象に含める。

また、同じ観点だけで loop し続けない。
次の loop では、直前とは異なる観点を 1 つ主軸に選ぶ。

- ownership / placement
- verification / testability
- runtime boundary / contract
- config / policy / sanctioned exception
- UX / content / accessibility
- performance / bundle / discovery
