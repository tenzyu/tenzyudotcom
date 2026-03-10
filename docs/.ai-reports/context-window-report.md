---
name: context-window-report
description: コンテキストウィンドウ浪費を減らすための改善案を整理した generated report。
summary: 入口、active plan、generated docs の混線を解き、読む順番と文書責務を細くする提案。
read_when:
  - エージェントの読む量を減らしたい時
  - docs の情報設計を見直したい時
skip_when:
  - 個別機能の実装だけを進める時
user-invocable: false
---

# Context Window Report

## 問題

この repo でコンテキストウィンドウを浪費しやすい主因は次の3つです。

- 入口に近い場所に読む必要の低い文書がある
- active plan にメモと実行契約が混在している
- 同じ内容を別名の文書で繰り返している

## 改善案

1. `AGENTS.md` から `docs/generated/` への導線を減らす
   - generated は参照時だけ明示的に開く隔離領域にする
   - 入口には durable rule と routing だけを残す

2. `docs/exec-plans/active/` を分割する
   - `active/ready/`: execution-ready plan
   - `active/backlog/`: メモ、追跡、未成熟な案
   - 毎回全 plan を読む必要をなくす

3. `AGENTS.md` をさらに table of contents に寄せる
   - 判断本文を書かない
   - 「どこを見るか」だけに限定する

4. generated report を 1 トピック 1 ファイルにする
   - `summary`, `comparison`, `report` のような重複命名を避ける
   - 似た内容を複数ファイルで持たない

5. durable rule と調査メモを分ける
   - rule は `docs/workflows` と `docs/design-docs`
   - 観測結果や一時分析は `docs/generated`
   - 相互参照は最小限にする

6. plan の先頭を短く固定する
   - `Goal`
   - `Scope`
   - `Verification`
   - `Completion Signal`
   - 背景説明は後段に回す

7. 読む順番を固定する
   - 新規タスクでは `AGENTS.md` → 関連 spec 1枚 → active plan 1枚で止める
   - 必要時だけ deeper docs を開く

## 優先順位

最初にやるべきなのは次の3点です。

1. `docs/generated` を入口から遠ざける
2. `active` を `ready` と `backlog` に分ける
3. `AGENTS.md` を routing 専用に寄せる

## 要約

この repo で一番効くのは、文書を増やすことではなく、入口に近い文書の数と役割を減らすことです。
特に `generated` と `active` の混線を解くだけで、毎回読む不要トークンをかなり削れます。
