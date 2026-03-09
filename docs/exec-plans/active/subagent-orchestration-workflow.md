---
name: subagent-orchestration-workflow
description: 進行中のタスク：prompt依存の運用を廃止し、exec-plan起点のサブエージェント実行フローへ統合する。
summary: メインエージェントが司令塔として計画を整え、サブエージェントが各自のワークスペースで実装し develop 向けPRを作成する標準運用を定義する。
read_when:
  - 新しいユーザー依頼を exec-plan に落としてから実装フローへ乗せたい時
  - 複数のサブエージェントへ作業を委譲するハーネスを整備する時
skip_when:
  - 単発の質問応答のみで実装やPR作成を伴わない時
user-invocable: false
---

# Subagent Orchestration Workflow

現在の `prompts/*` に置いていた運用意図をハーネスへ統合し、今後は `docs/exec-plans/active/*.md` を実行の起点にする。

## Goal

- メインエージェントが司令塔として task routing と優先順位付けを担当する
- 新しい作業依頼を受けたら、必要に応じて対応する exec-plan の作成や追記を補助する
- サブエージェントは該当 exec-plan を参照し、自身のワークスペースで実装、検証、ブランチ作成、`develop` 向け PR 作成まで行う
- 実装を通じて再利用可能な規律が見つかった場合は、`docs/workflows/*.md` などのハーネスへ還元する

## Deliverables

- `prompts/*` への依存を削除する
- ハーネス文書に orchestrator / sub-agent / exec-plan の責務分担を追加する
- execution-ready な exec-plan contract を追加する
- doc lint や到達性チェックを新しい導線に合わせて更新する
- 実際に少なくとも1件、サブエージェントへ作業を委譲して流れを検証する
