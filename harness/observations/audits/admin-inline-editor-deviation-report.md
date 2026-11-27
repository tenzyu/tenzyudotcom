---
schema: harness/v1
kind: observation
id: observation.audit.admin-inline-editor-deviation-report
title: Admin Inline Editor Deviation Report
status: active
summary: dependency inversion を適用せず page-level collection component で解決したこと、AdminGate を勝手に変更したこと、leaf affordance を作らなかったことを反省点としてまとめる。
read_when:
  - inline admin 実装をやり直すとき
  - 同じ逸脱を防ぐガードレールを定義するとき
x:
  legacy:
    name: admin-inline-editor-deviation-report
    description: 今回の inline admin 実装が repo のルールとユーザー期待から逸脱した理由を記録する。
    user_invocable: false
---

# Admin inline editor deviation report

## 実装上の逸脱

- `*-collection.tsx` のような巨大なページ単位のコンポーネントを新設した
- `AdminGate` の内側に広い範囲の UI とデータ取得をまとめ、leaf component 単位の差し込みにしなかった
- `src/features/admin/admin-gate.tsx` を勝手に書き換えた
- `dependency-inversion` ルールの `domain / port / contract / assemble` 分離を使わず、UI コンポーネントにデータ取得・保存・編集状態の管理を集約した
- 各ページで `adminState` を個別に持ち、同じ責務を繰り返した

## Dependency inversion を適用しなかった理由

- 表示の実装を優先した。admin 操作を application 層で実装せず、UI コンポーネントで処理した
- `notes` / `links` / `recommendations` / `pointers` / `puzzles` の保存パターンを共通の use case として再定義せず、各 component 内で fetch/save を組み立てた
- item-level affordance を差し込むための最小部品を作る代わりに、page 全体を client component 化してまとめて解決しようとした
- その結果、UI コンポーネントがデータの取得、保存、整形を直接実行する構造になった。これは `dependency-inversion` の規則に反する

## Leaf admin component を使用しなかった理由

- 三点リーダーや tweet button のような leaf component を既存 public component へ局所差し込みするより、ページごと差し替える方が早いと誤判断した
- 既存の公開コンポーネント構造を維持したまま admin affordance を埋め込む設計努力を省略した
- `AdminGate` を「差し込みたい一点にだけ巻く」のではなく、「admin 体験全体を囲う」使い方に寄せてしまった

## `AdminGate` の変更が問題だった理由

- `AdminGate` は認可に関する UI の基準実装である。個別のタスクの都合で変更してはならない
- `/api/auth/me` の呼び出し方と hydration の挙動は、認可の安全性と正しさに影響する
- 既存のガードを無視し、モジュール単位のキャッシュを導入した。この認可キャッシュ方式はレビューを受けていなかった

## 実装方針

- `AdminGate` の既存実装を維持する
- 既存 public component を基本的に維持し、三点リーダー component や tweet button component を leaf として差し込む
- admin action のデータ取得・保存は `*.port.ts`、`*.contract.ts`、`*.assemble.ts` で分担する
- page-level `*-collection.tsx` のような巨大統合 component は作らない
- UI は表示を担当し、admin state の制御は application 層で行う

## 残作業

- inline admin 実装を `dependency-inversion` パターンに沿ってやり直す
- `AdminGate` 不変、leaf affordance、巨大 collection component 禁止のガードレールを rules へ追加する
