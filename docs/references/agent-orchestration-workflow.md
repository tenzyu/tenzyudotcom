---
name: harness-subagent-orchestration-workflow
description: メインエージェントが exec-plan を起点にサブエージェントへ作業を委譲する標準運用。
summary: ユーザーの新規依頼を exec-plan に落とし込み、サブエージェントが各自の workspace で実装と検証と develop 向け PR 作成を行うまでの流れを定義する。
read_when:
  - ユーザーから新しい作業を受け、どの task を先に進めるか整理する時
  - docs/exec-plans/active 配下の plan を起点にサブエージェントへ作業を委譲する時
  - harness 自体の改善を project 変更と同じ loop で扱いたい時
skip_when:
  - 既に対象の exec-plan と担当サブエージェントが確定しており、個別実装だけを進める時
user-invocable: false
---

# Subagent Orchestration Workflow

この repo では、メインエージェントが司令塔になり、作業単位は `docs/exec-plans/active/*.md` に揃える。
prompt ファイルを直接実行起点にするのではなく、durable な docs と exec-plan を起点に進める。

この文書は `docs/exec-plans/active/subagent-orchestration-workflow.md` の運用意図を、恒久ルールとしてハーネスへ昇格したものである。

## 1. メインエージェントの役割

- 依頼を受けたら最初に `AGENTS.md` から routing する
- 既存の `docs/exec-plans/active/*.md` に該当 task があるか確認する
- 該当 task がなければ、ユーザーの依頼を短い `exec-plan` に落とし込むのを補助する
- task ごとの境界、依存関係、並列可否を決める
- 各 task をサブエージェントへ委譲し、結果を統合する
- prompt に閉じていた運用意図を、必要に応じて docs へ還元する

`作業開始` のような抽象指示では、いきなり実装に入る前に active plan の候補整理を優先する。

## 2. 新しい依頼を受けたとき

ユーザーが新しい作業をその場で指定した場合、次の順で処理する。

1. 既存の active plan に載っているか確認する
2. 無ければ、目的・完了条件・主要 TODO を短くまとめた `docs/exec-plans/active/<task>.md` の作成を補助する
3. その task で追加の恒久ルールが要るなら、実装前に docs 更新を先に行う
4. plan ができたら、サブエージェントへ plan の path を明示して委譲する

task の受け皿が未定義なまま、大きな実装を直接始めない。

## 3. サブエージェントへの委譲

- 1 task = 1 plan file を原則にする
- サブエージェントは、自分が担当する `docs/exec-plans/active/*.md` を source of truth として読む
- 作業は各サブエージェントの workspace で行う
- 依存が薄い task は並列化してよい
- メインエージェントは、競合しうる file scope と merge 順序を先に整理する

サブエージェントへの依頼には最低限次を含める。

- 対象の exec-plan path
- 触れてよい file scope
- 必須 verification
- `develop` 向け PR 作成が完了条件であること

## 4. 実装とハーネス改善の loop

project 実装と harness 改善は分離しない。
`docs/exec-plans/**` の task を進める中で、再利用可能な判断が出たら同じ task で docs へ還元する。

- `prompts/*` のような一時的な運用置き場へ戻さない
- current code ではなく target architecture を基準に判断する
- 同じ曖昧さが再発しそうなら、local judgment で終わらせず docs に昇格する
- harness 更新後は、粒度、競合、命名重複、`AGENTS.md` からの到達性を見直す
- 方向性が user の運用思想に依存する時だけ、短いインタビューを挟む

## 5. 完了条件

各サブエージェントの task 完了条件は次の通り。

- plan に書かれた実装が完了している
- 必須 verification を通している
- 必要な docs 更新が done になっている
- topic branch が `develop` 起点である
- `develop` を base にした PR を作成している

PR の具体手順は `docs/references/github-pr-workflow.md` を使う。
