---
name: harness-subagent-orchestration-workflow
description: メインエージェントが exec-plan を起点にサブエージェントへ作業を委譲する標準運用。
summary: 新しい依頼を active plan に揃え、execution-ready な task だけを委譲する流れを定義する。
read_when:
  - 新しい依頼を受けて task routing を決める時
  - active plan をサブエージェントへ委譲する時
skip_when:
  - 既に対象 plan と担当 agent が確定しており、個別実装だけを進める時
user-invocable: false
---

# Subagent Orchestration Workflow

この repo では、メインエージェントが司令塔になり、作業単位は `docs/exec-plans/active/*.md` に揃える。
prompt ではなく durable な docs と exec-plan を実行起点にする。

## Main Agent

- 最初に `AGENTS.md` で routing する
- 既存の active plan に該当 task があるか確認する
- 無ければ短い exec-plan を作る
- task ごとの境界、依存、並列可否を決める
- サブエージェントへ委譲し、結果を統合する

## New Request Flow

1. `docs/exec-plans/active/*.md` に既存 task があるか確認する
2. 無ければ `docs/exec-plans/active/<task>.md` を作る
3. 委譲する plan は [exec-plan-contract](./exec-plan-contract.md) に従って `execution-ready: true` へ整える
4. 追加の恒久ルールが必要なら、実装前に docs を更新する
5. plan path を明示してサブエージェントへ渡す

## Delegation

- 1 task = 1 plan file を原則にする
- サブエージェントは担当 plan を source of truth として読む
- 依存が薄い task は並列化してよい
- 競合しうる file scope と merge 順序は先に整理する

委譲時には最低限次を含める。

- 対象の exec-plan path
- allowed file scope
- required verification
- toolchain が repo の dev shell 経由なら、その wrapper を含んだ verification command
- expected return format

## Completion

- plan に書かれた実装が完了している
- required verification を通している
- 必要な docs 更新が done になっている
- PR 作成が必要な task は [github-pr-workflow](../references/github-pr-workflow.md) に従う
