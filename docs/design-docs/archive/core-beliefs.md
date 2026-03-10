---
name: harness-context
description: リポジトリのターゲットアーキテクチャのための設計原則と優先順位。
read_when:
  - トレードオフを評価したり、アーキテクチャをレビューしたりする時
  - どの原則を優先するかを決定する時
user-invocable: false
---

# Context

## Purpose

Context は判断順序と設計思想を定義する。
具体的な file placement の正本は `docs/design-docs/structure-rules.md`、
LLM 向け要約は `docs/ARCHITECTURE.md`、
安全制約の正本は `docs/design-docs/guardrails.md`、
道具の使い方は `docs/design-docs/tools-boundary.md` が担当する。

ここで保持するのは exhaustive spec ではなく、
「どの判断を repo の標準にするか」という軽量な宣言である。

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

## Editorial Role Separation

文言は全部同じ役割ではない。
metadata と on-page copy と nav/tile copy は分けて考える。

- metadata title / description
  - search / share で見える約束
  - 固有名詞と主題を優先し、詩的な煽りを主役にしない
- page header / hero copy
  - 実際に訪問した user に向けた導入
  - metadata より expressive でよい
- page lead
  - page header の直下で、その page に何があるかを 1〜2 文で説明する
  - metadata description をそのまま流用せず、訪問後の理解を優先する
- nav / tile description
  - 1 行で行き先を判断させる短い説明
  - page lead をそのまま流用しない

SEO のために page copy を平板にする必要はないが、
metadata の役割まで混ぜない。

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

既存コードに引っ張られたくない論点は、暗黙知のままにしない。
harness 側で「ここは precedent にしない」と宣言して止める。

- 現状コードは参考資料であって規範ではない
- 明示的に止めない限り AI は既存コードを強く参照する前提で扱う
- その慣性を切る宣言は、実装メモではなく harness に置く

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
- 判断宣言は短くし、個別 task の具体例や失敗談は `docs/exec-plans/completed/*.md` に残す
