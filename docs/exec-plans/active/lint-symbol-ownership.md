---
name: lint-symbol-ownership
description: symbol 単位の ownership を解析し、demote / promote 候補を検出する linter を追加する
summary: TypeScript の symbol references を使って exported declaration の実共有状況を owner 単位で判定し、fixture test と実プロジェクトの clean run まで行う
read_when:
  - symbol 単位の local-first / promote-later lint を実装するとき
  - dependency-cruiser では足りない粒度の ownership 監査を追加するとき
execution-ready: true
---

## Goal

`dependency-cruiser` では見えない symbol 単位の共有事実を解析し、demote すべき shared value symbol と promote すべき route-local value symbol を検出する `lint-symbol-ownership` を実装する。

## Scope

- `scripts/lint-symbol-ownership.ts`
- `scripts/lint-symbol-ownership.test.ts`
- `package.json` scripts
- 必要な owner 正規化ロジック
- 実プロジェクトに残っている lint-symbol-ownership 違反の解消

## Deliverables

- symbol ownership linter CLI
- fixture ベースの unit test
- package script 追加
- 実プロジェクトでの clean run

## Task Breakdown

1. spec に沿って owner 正規化ルールを定義する
2. 初期版の対象を plain な実装 file に絞り、layer 定義 file を除外する
3. TypeScript Language Service ベースで exported symbol references を集計する
4. `demote` / `promote` の判定ロジックを実装する
5. fixture project を使った `lint-symbol-ownership.test.ts` を追加する
6. 実プロジェクトで linter を走らせ、検出された問題を解消する
7. lint と test を通して完了とする

## Subagent Contract

- plan path: `docs/exec-plans/active/lint-symbol-ownership.md`
- allowed file scope:
  - `scripts/**`
  - `src/**`
  - `package.json`
  - `docs/product-specs/site/lint-symbol-ownership.md`
  - `docs/exec-plans/active/lint-symbol-ownership.md`
- required verification:
  - `bun test scripts/lint-symbol-ownership.test.ts`
  - `bun run lint`
- expected return format:
  - changed files
  - implementation summary
  - verification result
  - remaining risks

## Verification

- `scripts/lint-symbol-ownership.test.ts` が通る
- `bun run lint-symbol-ownership` が実プロジェクトで 0 exit code になる
- `bun run lint` が通る

## Completion Signal

- symbol 単位で demote / promote 候補を検出できる
- fixture test が期待どおりに失敗 / 成功を判定できる
- 実プロジェクトで lint-symbol-ownership の問題が残っていない
