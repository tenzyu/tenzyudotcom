---
name: harness-orchestration-readiness
description: 完了済みタスク：サブエージェント委譲を実運用できるようハーネスを強化したケース記録。
summary: exec-plan の実行契約、doc lint の強制、実際の委譲検証を同じループで揃えた結果を残す。
read_when:
  - ハーネスの委譲運用がどの条件で実用段階に達したかを振り返る時
  - execution-ready plan と doc lint の導入経緯を確認したい時
skip_when:
  - まだ未着手の active plan をこれから execution-ready 化する時
user-invocable: false
---

# Harness Orchestration Readiness

## Goal

- exec-plan をサブエージェントの source of truth として実際に使える形にする
- execution-ready な plan に必要な項目を durable rule として定義する
- `lint-docs` で最低限の欠落を検出できるようにする
- 少なくとも 1 件、実際にサブエージェントへ委譲して運用を検証する

## Scope

- `docs/workflows/agent-orchestration-workflow.md`
- `docs/workflows/exec-plan-contract.md`
- `docs/exec-plans/active/*.md`
- `scripts/lint-docs.ts`

## Non-Goals

- 既存の軽量な follow-up plan をすべて execution-ready へ書き換えること
- GitHub PR 作成までをこの task で必須化すること

## Deliverables

- execution-ready な exec-plan の必須項目を定義した reference を追加する
- オーケストレーション workflow からその reference へ到達できるようにする
- `execution-ready: true` の active plan に対して section lint を追加する
- 実際のサブエージェント委譲結果をこの plan に記録する

## Task Breakdown

### 1. Contract

- execution-ready plan の frontmatter と section contract を定義する
- 軽量メモ型 active plan と execution-ready plan の違いを明示する

### 2. Enforcement

- `scripts/lint-docs.ts` で `execution-ready: true` の plan を検出する
- 必須 section と空でない bullet list を検証する

### 3. Validation

- サブエージェントへ bounded task を 1 件委譲する
- handoff の入力、期待出力、戻り値の品質を確認する
- 欠けていた rule があれば docs へ還元する

## Subagent Contract

- original plan path: `docs/exec-plans/active/harness-orchestration-readiness.md`
- allowed file scope:
  - `docs/workflows/*.md`
  - `docs/exec-plans/*.md`
  - `scripts/lint-docs.ts`
- required verification:
  - `nix develop -c bun run lint:docs`
- return format:
  - changed files
  - verification result
  - unresolved risks

## Verification

- `nix develop -c bun run lint:docs`

## Completion Signal

- execution-ready contract が durable docs に定義されている
- lint が execution-ready plan の最低欠落を検出できる
- 実際の委譲を 1 件以上行い、この plan に結果を記録している

## Delegation Log

- 2026-03-09 explorer
  - task: active plan の最小 contract と現行 plan 群の不整合を監査
  - result: `Goal`、`Deliverables`、file scope、verification、completion criteria の欠落が委譲阻害要因だと確認
  - impact: 軽量メモ型 plan と execution-ready plan を分ける contract と lint 追加へ反映
- 2026-03-09 worker
  - task: legacy active plan の migration gap を durable memory へ還元する観点を確認
  - result: lightweight plan と execution-ready plan の混在が継続ギャップであり、昇格 trigger を debt として残すべきだと一致
  - impact: `docs/exec-plans/tech-debt-tracker.md` に migration trigger を追記
- 2026-03-09 worker
  - task: verification command が repo dev shell 前提でも handoff だけで実行できるよう、contract と workflow の明文化を追加
  - result: `docs/workflows/exec-plan-contract.md` と `docs/workflows/agent-orchestration-workflow.md` に dev shell wrapper を含んだ verification command を plan に明記する rule を追加
  - impact: 実委譲で `nix develop -c bun run lint:docs` を実行でき、返り値形式と verification の前提が会話に依存しないことを確認
- 2026-03-09 main-agent
  - task: active plan の完了判定を repo 状態と照合し、完了済み plan を completed へ移す運用を durable rule に昇格
  - result: workflow に completion sweep を追加し、この plan 自体も completed へ移行できる状態だと確認
  - impact: active plan の棚卸しと完了アーカイブを AI が同じ依頼の中で閉じられるようになった
