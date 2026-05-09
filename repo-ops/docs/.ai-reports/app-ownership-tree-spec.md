---
name: app-ownership-tree-spec
description: src/app の directory tree を ownership の正本にし、symbol の promote/demote を least common owner で判定する仕様。
summary: src/features は app tree で自然表現できない cross-branch shared の例外層とし、lint-symbol-ownership を owner tree ベースへ拡張する。
read_when:
  - ownership の整理整頓を進めるとき
  - src/features の必要性を参照事実で見直したいとき
  - promote / demote の自動検知ルールを確認したいとき
user-invocable: false
---

# App Ownership Tree Spec

## Goal

- `src/app` の owner tree を正本にする
- exported symbol ごとの参照事実で promote / demote を判定する
- `src/features` は例外層に縮退させる

## Ownership Roots

- `src/app`: ownership tree の正本
- `src/components`: presentation primitive
- `src/config`: site-wide config
- `src/lib`: low-level helper / infra substrate
- `src/features`: app tree で自然表現できない shared の例外層

## Owner Resolution

- `src/app/**/_features/**` の owner は `_features` の直前の directory
- `src/app/**` の非 `_features` file の owner は file を含む directory
- `src/features/**` の owner は `src/features/<domain>`
- `src/components/**` の owner は `src/components/<domain>`
- `src/lib/**` の owner は `src/lib/<domain>`
- `src/config/**` の owner は `src/config`

## Placement Rule

- owner 専用 symbol はその owner 配下に置く
- 複数 owner から参照される symbol は least common owner へ promote する
- `src/features` は least common owner が `src/app` まで上がって粗すぎる場合のみ許容する

## Initial Lint Scope

- `const`
- `function`
- value export only
- test/spec/type-only import は除外

## Initial Outputs

- `promote`: current owner が深すぎる
- `demote`: current owner が浅すぎる
- `targetOwner`: move 先候補
