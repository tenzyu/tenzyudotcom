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

active plan には 2 種類ある。

- 軽量メモ型
  - follow-up、debt、運用メモを短く残す plan
- execution-ready 型
  - サブエージェントへそのまま渡せる plan
  - frontmatter に `execution-ready: true` を持つ

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
- handoff 情報を会話だけに閉じ込めない
- shared rule に昇格すべき判断は docs へ還元する
- 軽量メモ型 plan を無理に execution-ready 化しない
