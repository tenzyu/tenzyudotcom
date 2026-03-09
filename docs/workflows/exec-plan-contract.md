---
name: harness-exec-plan-contract
description: サブエージェントへ委譲できる execution-ready な exec-plan の最小契約。
summary: 軽量メモ型 plan と execution-ready plan の違い、および委譲に必要な section を定義する。
read_when:
  - 新しい exec-plan を作る時
  - active plan をサブエージェントへ渡せる粒度に整える時
skip_when:
  - completed plan の履歴だけを読む時
user-invocable: false
---

# Exec-Plan Contract

この repo では `docs/exec-plans/active/*.md` が `PLANS.md` / ExecPlan の実体である。
active plan は backlog を含む作業用 artifact であり、違う LLM や違うセッションへ渡っても同じ作業を再開できるよう継続更新する。
この文書はその中でも、`execution-ready: true` を付けて委譲する plan の最小契約だけを定義する。

## Role Split

- [plan-authoring-workflow](./plan-authoring-workflow.md): plan の下書きと型の選択
- この文書: `execution-ready` plan の必須項目
- [agent-orchestration-workflow](./agent-orchestration-workflow.md): 委譲、review、completed への移動

## Plan Shapes

active plan には 2 種類ある。

- 軽量メモ型
  - follow-up、debt、継続更新する backlog メモを残す plan
- execution-ready 型
  - サブエージェントへそのまま渡せる plan
  - frontmatter に `execution-ready: true` を持つ

active plan 全体が委譲可能なのではなく、委譲可能なのは execution-ready 型だけである。

## Required Sections

execution-ready plan には次を揃える。

## Goal

- done の条件を outcome で書く

## Scope

- 触れてよい file scope か subsystem scope を書く

## Deliverables

- 完了時に揃う成果物を bullet で書く

## Task Breakdown

- main steps を bullet か小見出しで書く

## Subagent Contract

- plan path
- allowed file scope
- required verification
- expected return format

## Verification

- 実行すべき command を列挙する
- repo toolchain が global install 前提でない場合は、`nix develop -c ...` のように wrapper を含めて書く
- 実行不能なら blocked 条件を書く

## Completion Signal

- メインエージェントが統合判断できる done 条件を書く

## Writing Rules

- 1 task = 1 file を守る
- active plan は session memory を兼ねるため、進捗、判断、次の着手点を継続更新する
- handoff 情報を会話だけに閉じ込めない
- shared rule に昇格すべき判断は docs へ還元する
- 軽量メモ型 plan を無理に execution-ready 化しない
- `docs/exec-plans/completed/*.md` は pure work log であり、rule の正本として扱わない
