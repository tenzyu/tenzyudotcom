---
name: harness-context
description: Design principles and priority order for the repo's target architecture. Read when evaluating tradeoffs, reviewing architecture, or deciding which principle wins.
user-invocable: false
---

# Context

## Purpose

Context は判断順序と設計思想を定義する。
具体的な file placement は `structure.md`、
安全制約は `guard.md`、
道具の使い方は `tools.md` が担当する。

## When to Apply

この文書を読むのは次のとき。

- 設計判断の優先順位を決めたい
- 原理同士が衝突している
- current code と target architecture のどちらを基準にすべきか確認したい
- architecture review や設計批評を行う

## Core Stance

この project で最重要の文脈は、`local-first, promote-later` である。

続いて大事にしたい補助原理は次の通り。

- `Feature-first, Pattern-later`
- `Workflow-aligned, Not Syntax-aligned`
- `Proximity-driven, Overhead-minimal`
- `Attribute-priority, Discovery-oriented`

これらは同格の標語ではない。
ownership を先に決め、その後で探索効率と作業動線を最大化するための判断軸として使う。

## Workflow

設計判断では次の順で使う。

1. `local-first, promote-later` を前提に置く
2. ownership を決める
3. feature / shell / site-ui / pure logic / content のどれが最上位属性か決める
4. workflow と proximity で調整する
5. pattern 分割は最後に考える

## Priority Order

この repo では、原理の優先順を次のように置く。

1. ownership は local か shared か
2. 最上位の属性は feature か shell か site-ui か pure logic か content か
3. feature の内部では workflow と proximity を優先する
4. pattern は最後に整理する
5. reuse が実在したら promote する

改善 loop では、同じ観点の繰り返しを避ける。
1 周ごとに主観点を 1 つ決め、次周では別の観点へ rotate する。

典型の観点:

- ownership / placement
- contract / boundary
- verification / regression risk
- config / policy / exception management
- UX / editorial clarity
- performance / bundle / discovery

`components/`, `hooks/`, `utils/` のような横断バケツは、
feature と ownership の判断を済ませた後にだけ使う。

## Principle Notes

### Feature-first, Pattern-later

最初の分類基準は React の構文ではなく、feature の責務である。

### Workflow-aligned, Not Syntax-aligned

PR と修正動線が feature 単位で進む以上、
構造も「この機能を直すときにどこを見るか」に沿うべきである。

### Proximity-driven, Overhead-minimal

同時に読むものは近くに置く。
早すぎる抽象化や shared 化は、再利用より先に認知負荷を増やす。

### Attribute-priority, Discovery-oriented

ディレクトリ構造は「どの属性を先に見ると最短で辿り着けるか」の設計である。
この repo では、通常は feature / shell / site-ui / pure logic / content を
構文属性より強い分類軸として扱う。

## Normative Stance

この文書群は current code に迎合しない。
現状の配置が target architecture とズレている場合、
そのズレは例外の正当化ではなく、移行順序を考えるべき設計負債として扱う。

- 現状に存在する path は、そのまま正しいとは見なさない
- current implementation より target architecture を優先して評価する
- 一度の変更で全量移行できない場合でも、局所的に target へ近づける

## What Context Must Prevent

Context は次の誤りを防ぐために存在する。

- 現状コードを理由に target structure を引き下げること
- feature より先に syntax bucket を作ること
- 「再利用されそうだから」で premature に shared 化すること
- domain knowledge を `site-ui` に押し込むこと
- `src/features/<domain>` 同士を安易に直接依存させること
- 開発者の探索動線より見た目の整然さを優先すること

## Model-Agnostic Requirement

この Context は特定モデルに最適化しすぎないこと。
軽量なモデルでも最低限の判断ができる粒度に保つ。

- ルールは path と責務に紐付ける
- モデル固有のプロンプト技巧に依存しない
- repo 構造そのものに意味を持たせる
