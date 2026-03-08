---
name: harness-guard
description: Safety and execution constraints for harness-guided work. Read before risky edits, structural refactors, reviews, or final reporting.
user-invocable: false
---

# Guard

## Purpose

Guard は、入力と出力、そして実行過程を監視する層である。
壊しやすい操作を狭い安全域に閉じ込めるためにある。

## When to Apply

この文書を読むのは次のとき。

- 変更を実行する前に unsafe な操作がないか確認したい
- 大きな refactor や directory 再編を始める
- review や監査として問題点を洗い出す
- 最終報告で何を明示すべきか確認したい

## Input Guard

エージェントは依頼を受けたら、最初に次の分類を行う。

- 構造変更か
- feature 実装か
- content 更新か
- pure logic 修正か
- 調査 / review か

そして以下を必ず見分ける。

- 変更対象が route-local か shared か
- request が `context.md` や `structure.md` の原則から外れていないか
- 依頼が current scope を越えていないか
- 一時データと恒久データが混ざっていないか
- unsafe な操作が必要か

## Workflow

Guard は次の順で使う。

1. request を分類する
2. slow down 条件がないか確認する
3. 実行中は structure / mutation / tool boundary を監視する
4. harness gap が見えたら docs 更新か follow-up debt 化を判断する
5. 最終報告で structural decision と未検証事項を明示する

### Refuse / Slow Down Conditions

次の条件では、そのまま進めずに一段階判断を遅くする。

- 既存の shared 層を route-private が逆参照している
- identifiers を翻訳辞書に入れようとしている
- `src/lib` に UI や route-only helper を置こうとしている
- route convention file が transform や metadata assembly を直接抱えている
- feature を差し置いて syntax-first の bucket を増やそうとしている
- reuse が実証される前に過剰な抽象化や promote をしようとしている
- current code に合わせるために harness の原則を弱めようとしている
- docs を読んでも placement 候補が複数残り、どれを第一候補にするか決めきれない
- destructive な git / filesystem 操作が必要

## Execution Guard

エージェントは実行中に以下を守る。

### Structural Guard

- file placement は `structure.md` に従う
- 現状構造が target とズレる場合、可能なら変更単位の中で target へ一歩寄せる
- directory 再編は workflow 改善の根拠があるときだけ行う
- `page.tsx`, `layout.tsx`, `generateMetadata`, `generateStaticParams` は route entry として薄く保つ
- route entry で見つけた transform / SEO / editorial shaping は `_features/lib` または feature component へ寄せる

### Mutation Guard

- unrelated changes を巻き戻さない
- user changes を消さない
- 既存構造を壊すときは、先に移動先を作る
- rename 後に import を一括で確認する

### Tool Boundary Guard

- Intlayer の利用境界は `tools.md` と `structure.md` に従う
- hidden prompt scaffolding や model-specific な convenience layer を増やさない
- internal barrel import を増やさない

### Verification Guard

変更に応じて、実行可能な verification を最低 1 つは通す。

- runtime / route / data flow を触ったら `build`
- formatter / linter / config / import graph を触ったら `lint` または `format`
- test が存在する repo では、影響範囲に応じた test を通す

test を増やす価値が高いのは次のとき。

- parse / normalize / validate をしている
- branch が多い pure logic がある
- metadata / structured data / contract を組み立てている
- bug を再発防止したい

逆に、静的 page の見た目だけを snapshot で広く固定するのは慎重にする。
保守コストに対して得が小さいなら、build と lint を優先する。

repo に test が未整備なら、それ自体を gap として報告する。
ただし test 不在を理由に build/lint まで省略しない。

環境差異で command が失敗する場合は、黙って諦めない。

- NixOS など platform 固有の実行問題か
- tool binary の配布形態が原因か
- repo-local に吸収できるか

を切り分け、回避策を docs か repo に還元する。

ops runtime がまだ repo に存在しない場合は、
そのためだけに test/ops の枠を増やさない。
必要が現れた時点で owner を定義する。

### Harness Gap Guard

次の両方を満たしたら、harness gap として扱う。

- 既存 docs を読んでも placement / boundary の判断に追加推論が必要だった
- その追加推論が他の task でも再利用されそうである

- 同じ task で安全に更新できるなら `docs/harness` を直す
- 直さない場合は、最終報告で不足している rule を具体的に列挙する
- 「今回はこうしたが docs にはない」を曖昧なまま残さない

## Output Guard

最終出力では、次を明示する。

- 何を promote したか
- 何を demote したか
- どの structural decision を採ったか
- まだ検証していないことは何か

出力で避けるべきこと:

- 実際にはしていない build / test をしたように書く
- 曖昧な「整理しました」で終える
- file placement の根拠を省く

## Negative Capabilities

この repo でエージェントにさせないこと:

- route-private を習慣的に shared へ押し上げること
- 開発者の探索動線より syntax bucket の整然さを優先すること
- 既存配置を理由に target architecture を空文化させること
- repo 全体の思想に反する convenience layer を追加すること

## Lightweight, Replaceable Design

Guard は model-specific であってはならない。

必要なのは:

- path-based constraints
- ownership-based constraints
- side-effect awareness
- honesty in reporting

不要なのは:

- 特定モデル向けの長大な振る舞いチューニング
- hidden chain-of-thought 前提の安全装置
