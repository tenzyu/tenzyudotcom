---
name: subagent-orchestration-workflow
description: 完了済みタスク：prompt依存の運用を廃止し、exec-plan起点のサブエージェント実行フローへ統合したケース記録。
summary: メインエージェントが司令塔として計画を整え、execution-ready plan を起点に委譲する標準運用へ移行した結果を残す。
read_when:
  - オーケストレーション運用を active plan 起点へ移した経緯を確認したい時
  - orchestrator / sub-agent / exec-plan の責務分担が固まった背景を振り返る時
skip_when:
  - 現在の委譲ルールそのものを参照したい時
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

## Outcome

- `docs/workflows/agent-orchestration-workflow.md` と `docs/workflows/exec-plan-contract.md` が導線になり、prompt ではなく durable doc を起点に委譲できるようになった
- `scripts/lint-docs.ts` が `execution-ready: true` の plan に必須 section を強制し、委譲前の欠落を止められる状態になった
- `docs/exec-plans/completed/harness-orchestration-readiness.md` に実際の委譲ログが残り、運用検証まで完了した状態を履歴として辿れる
