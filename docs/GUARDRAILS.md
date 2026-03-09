---
name: harness-guardrails-summary
description: LLM が作業前に確認する運用 guard の要約。
summary: "`docs/design-docs/guardrails.md` を正本として、オーケストレーターと worker が共通で守る入力、実行、報告の guard を短く案内する。"
read_when:
  - 実装、レビュー、リファクタリングの前に運用 guard を素早く確認したい時
  - オーケストレーターと worker の責務境界を揃えたい時
skip_when:
  - 詳細な禁止パターンや slow down 条件まで読みたい時
user-invocable: false
---

# Guardrails (GUARDRAILS)

この文書は LLM 向けの要約である。
guard rule の正本は [docs/design-docs/guardrails.md](./design-docs/guardrails.md) に置く。

## Role Split

- orchestrator
  - request を分類する
  - plan を作るか更新する
  - 必要なインタビューを行う
  - worker へ scope と verification を渡す
  - completed log への移動と rule promote を判断する
- worker
  - 許可された file scope だけを変更する
  - plan と guardrail の範囲内で実装、検証、報告する
  - reusable rule を completed log に埋めない

## Input Guard

- file placement は [ARCHITECTURE](./ARCHITECTURE.md) で要約を見て、正本は [structure-rules](./design-docs/structure-rules.md) を使う
- user の価値観や運用思想が無いと structural decision を切れない時は、実装前に短いインタビューを行う
- docs に判断基準が無い新しい noun / route / workflow / runtime を持ち込む時は、先に docs 更新を優先する

## Execution Guard

- active plan は backlog を含む継続更新 artifact であり、別セッションでも再開できるよう常に最新化する
- active plan のうち、委譲可能なのは `execution-ready: true` を持つものだけ
- completed plan は pure work log であり、rule の正本ではない
- verification は plan に書いた command を通す
- unrelated changes は戻さない

## Where To Go Next

- 詳細な guard 条件: [docs/design-docs/guardrails.md](./design-docs/guardrails.md)
- file placement の正本: [docs/design-docs/structure-rules.md](./design-docs/structure-rules.md)
- active plan の作り方: [docs/workflows/plan-authoring-workflow.md](./workflows/plan-authoring-workflow.md)
- `execution-ready` 契約: [docs/workflows/exec-plan-contract.md](./workflows/exec-plan-contract.md)
- orchestrator の委譲手順: [docs/workflows/agent-orchestration-workflow.md](./workflows/agent-orchestration-workflow.md)
