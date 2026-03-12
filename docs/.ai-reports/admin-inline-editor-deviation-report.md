---
name: admin-inline-editor-deviation-report
description: 今回の inline admin 実装が repo のルールとユーザー期待から逸脱した理由を記録する。
summary: dependency inversion を適用せず page-level collection component で解決したこと、AdminGate を勝手に変更したこと、leaf affordance を作らなかったことを反省点としてまとめる。
read_when:
  - inline admin 実装をやり直すとき
  - 同じ逸脱を防ぐガードレールを定義するとき
user-invocable: false
---

# Admin Inline Editor Deviation Report

## What Went Wrong

- `*-collection.tsx` のような page-level 巨大コンポーネントを新設して解決しようとした
- `AdminGate` の内側に広い範囲の UI とデータ取得をまとめ、leaf component 単位の差し込みにしなかった
- `src/features/admin/admin-gate.tsx` を勝手に書き換えた
- `dependency-inversion` ルールの `domain / port / contract / assemble` 分離を使わず、UI コンポーネントへ取得・保存・編集状態を寄せた
- 各ページで `adminState` を個別に持ち、同じ責務を繰り返した

## Why Dependency Inversion Was Not Applied

- 「まず見た目を出す」ことを優先しすぎて、admin 操作を application 層へ落とさず UI 側で抱え込んだ
- `notes` / `links` / `recommendations` / `pointers` / `puzzles` の保存パターンを共通の use case として再定義せず、各 component 内で fetch/save を組み立てた
- item-level affordance を差し込むための最小部品を作る代わりに、page 全体を client component 化してまとめて解決しようとした
- 結果として `dependency-inversion` で避けるべき「UI コンポーネントの中で直接取得・保存・整形を行う」構造になった

## Why Leaf Admin Components Were Not Used

- 三点リーダーや tweet button のような leaf component を既存 public component へ局所差し込みするより、ページごと差し替える方が早いと誤判断した
- 既存の公開コンポーネント構造を維持したまま admin affordance を埋め込む設計努力を省略した
- `AdminGate` を「差し込みたい一点にだけ巻く」のではなく、「admin 体験全体を囲う」使い方に寄せてしまった

## Why Changing AdminGate Was Wrong

- `AdminGate` は認可 UX の基準実装であり、各タスクで都合よく変えてよい場所ではない
- `/api/auth/me` の呼び方や hydration 挙動は security / correctness に影響する
- 既存ガードを無視して module-level cache を勝手に持ち込んだことで、レビューされていない認可キャッシュ戦略を導入してしまった

## Correct Direction

- `AdminGate` は既存実装を尊守する
- 既存 public component を基本的に維持し、三点リーダー component や tweet button component を leaf として差し込む
- admin action の取得・保存は `*.port.ts` `*.contract.ts` `*.assemble.ts` 側へ寄せる
- page-level `*-collection.tsx` のような巨大統合 component は作らない
- UI は表示責務に寄せ、admin state の orchestration は application 層へ押し下げる

## Required Follow-up

- inline admin 実装を `dependency-inversion` パターンに沿ってやり直す
- `AdminGate` 不変、leaf affordance、巨大 collection component 禁止のガードレールを rules へ追加する
