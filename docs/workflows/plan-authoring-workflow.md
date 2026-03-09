---
name: harness-plan-authoring-workflow
description: ユーザーやオーケストレーターが active plan の Markdown を起こす時の作成補助フロー。
summary: "`docs/exec-plans/active/*.md` をこの repo における `PLANS.md` / ExecPlan として扱い、軽量メモ型と execution-ready 型の書き分けを支援する。"
read_when:
  - 新しい依頼から active plan を起こす時
  - 既存 task が無く、ユーザー向けに plan の Markdown を素早く下書きしたい時
  - lightweight plan を execution-ready plan へ昇格させる前に必要項目を確認したい時
skip_when:
  - 既に対象 plan が存在し、個別実装だけを進める時
user-invocable: false
---

# Plan Authoring Workflow

この repo では `docs/exec-plans/active/*.md` を、top-level `PLANS.md` の代わりに使う。
active plan は backlog を含む作業用 artifact であり、大きい変更や委譲対象の task は会話ではなくこの plan を source of truth にする。
違う LLM や違うセッションへ引き継いでも再開できるよう、active plan は意味のある進捗ごとに更新する。

## Role Split

- この文書: plan をどう書き始めるかを決める
- [exec-plan-contract](./exec-plan-contract.md): `execution-ready` 型の必須項目を定義する
- [agent-orchestration-workflow](./agent-orchestration-workflow.md): plan を誰にどう委譲し、どう閉じるかを定義する

## 1. Intake

plan を起こす前に、最低限次を揃える。

- task の一文要約
- done の条件
- 触る file scope または subsystem
- 必要な verification
- すぐ委譲するか、まず追跡メモとして残すか

file scope が曖昧なら、先に [ARCHITECTURE](../ARCHITECTURE.md) と [structure-rules](../design-docs/structure-rules.md) で第一候補の置き場を決める。

## 2. Decide The Type

軽量メモ型にする時:

- follow-up、debt、保留メモを短く残したい
- まだ file scope や verification が固まっていない
- サブエージェントへ今すぐ渡さない
- 次のセッションへ判断材料を残したい

execution-ready 型にする時:

- そのまま委譲したい
- done 条件、scope、verification が書ける
- handoff 情報を会話ではなく plan 本体に閉じ込めたい

execution-ready 型の section contract は [exec-plan-contract](./exec-plan-contract.md) を使う。

## 3. Author The Frontmatter

どちらの型でも frontmatter には次を入れる。

- `name`
- `description`
- `summary`
- `read_when`
- 必要なら `skip_when`
- 必要なら `user-invocable`

execution-ready 型に昇格させる時だけ `execution-ready: true` を付ける。

## 4. Start From A Small Skeleton

Lightweight plan skeleton:

```md
---
name: <task-name>
description: 進行中のタスク：<何を保留・追跡するか>
summary: <なぜ残すか>
read_when:
  - <読む条件>
skip_when:
  - <読まなくてよい条件>
user-invocable: false
---

# <Title>

<状況、未解決点、次に判断すべきことを短く書く。>
```

Execution-ready plan skeleton:

```md
---
name: <task-name>
description: 進行中のタスク：<何を実行するか>
summary: <この task の狙い>
read_when:
  - <読む条件>
skip_when:
  - <読まなくてよい条件>
user-invocable: false
execution-ready: true
---

# <Title>

## Goal

- <done の条件>

## Scope

- <allowed file scope or subsystem>

## Deliverables

- <完了時の成果物>

## Task Breakdown

- <main step 1>
- <main step 2>

## Subagent Contract

- plan path: `docs/exec-plans/active/<task>.md`
- allowed file scope:
  - `<scope>`
- required verification:
  - `nix develop -c <command>`
- return format:
  - changed files
  - verification result
  - unresolved risks

## Verification

- `nix develop -c <command>`

## Completion Signal

- <メインエージェントが完了と判断できる条件>
```

## 5. Review Before Delegation

委譲前に次だけ確認する。

- この plan だけ読めば task の目的と done が分かるか
- backlog として残す情報が薄すぎず、次のセッションで再開できるか
- `allowed file scope` と `required verification` が会話依存になっていないか
- lightweight のままでよいのに、無理に `execution-ready: true` を付けていないか
- completion 後に `completed` へ移しても履歴として読める文面か

## 6. Promote Or Archive

- 追跡メモや backlog のままなら active に残し、進捗や次の着手点を更新する
- 委譲するなら execution-ready 型へ昇格させる
- 完了後は [agent-orchestration-workflow](./agent-orchestration-workflow.md) に従って completed へ移す
- completed は pure work log として扱い、rule の正本にしない
