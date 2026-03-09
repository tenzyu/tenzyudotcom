---
name: harness-memory
description: リポジトリのharnessのためのメモリモデル。
read_when:
  - 何を記憶し、何を忘れ、何が一時的なコンテキストではなく永続的なドキュメントに属するかを決定する時
user-invocable: false
---

# Memory

## Purpose

Memory は「何を覚え続けるか」を定義する。
記憶の寿命と保存先を分ける。

特に、この repo では
軽量な判断宣言と、具体的な失敗知・成功条件を分けて保持する。

## When to Apply

この文書を読むのは次のとき。

- 何を session 限りで捨てるべきか迷う
- 何を repo memory として毎回読み直せばよいか整理したい
- docs に何を残すべきか決めたい
- temporary note と durable knowledge を分けたい

## Memory Layers

この repo の Memory は 4 層で考える。

1. Session memory
2. Repo memory
3. Structural memory
4. Durable human-authored memory

## Workflow

記憶の扱いでは次の順で判断する。

1. これは作業が終われば不要か
2. repo に埋め込まれた方針として毎回読み直せるか
3. 構造が覚えてくれるべきか
4. 人間向け文書として durable に残す価値があるか

## 1. Session Memory

その場の作業でだけ必要なもの。

例:

- いま触っている file 群
- 作業中の rename 関係
- 一時的な import 差し替え
- 途中の TODO

これは作業が終われば捨ててよい。

## 2. Repo Memory

repo 自体に埋め込まれた方針。

例:

- `AGENTS.md` のルール
- `docs/design-docs/*.md` と `docs/workflows/*.md` の設計
- `local-first, promote-later`

## 3. Structural Memory

構造そのものが覚えてくれる記憶。

たとえば:

- どこまでが route-local か
- どこからが shared か
- どの path が feature を表すか

この層の具体は `docs/design-docs/structure-rules.md` を正本とし、
LLM 向け要約は `docs/ARCHITECTURE.md` に置く。

## 4. Durable Human-Authored Memory

人間が後から参照できる設計文書。

ここに残すべきもの:

- 設計思想
- 置き場所の判断基準
- Guard 条件
- tool boundary
- known gaps と deferred decision
- current code を precedent にしない宣言
- 複数 task / 複数 route で再発した曖昧さへの恒久ルール

ただし durable memory は 2 種類に分ける。

### Harness Memory

`docs/design-docs/*.md` と `docs/workflows/*.md` は、repo-wide rule と process を保持する。

- 何を標準とするか
- 何を禁止するか
- どの原理を優先するか
- 既存コードの慣性をどこで止めるか

task ごとの scratch log や完了済み作業ログの置き場ではない。

### Case Memory

`docs/exec-plans/completed/*.md` は、完了した task の具体的な作業ログとして扱う。

- 何が失敗したか
- なぜ失敗したか
- どうすれば成功したか
- どの分岐を検討し、何を捨てたか
- 実装前インタビューで何が未確定だったか
- current code に引っ張られると何を誤るか

要するに、`design-docs` / `workflows` が rule を持ち、
`completed` が case と evidence を持つ。

### Repo-Specific Memory

`docs/product-specs/*.md` は、
この repo 固有の route / subsystem spec を扱う。

- product goal
- collection spec
- repo 固有の architecture note
- subsystem の operating model

ここに残すべきでないもの:

- 一時的な API response
- 個別作業の scratch notes
- volatile な観測値
- secrets

## What To Remember

この repo の Memory は次を優先して保持する。

- ownership boundary
- principle の優先順位
- path semantics
- tool boundary
- guard condition

## When To Update Harness

次の条件を満たしたら、local judgment のままにせず
`docs/design-docs` または `docs/workflows` の更新を検討する。

- 同じ種類の曖昧さが 2 route 以上で再発した
- placement 判断が current code ではなく target architecture の補足を必要とした
- 既存文書を読んでも複数の妥当そうな置き場所が残った
- 最終報告で毎回同じ補足説明を書き足している

`2 route` は十分条件であって必要条件ではない。
dashboard + worker、webhook + admin、route + config のように、
owner の曖昧さが別 runtime 間で再発した場合も更新対象にする。

特に、path semantics や ownership の語彙を 1 段増やした場合は、
その task の中で harness へ還元するのを優先する。

## What Not To Remember

次は durable memory にしない。

- 再利用不能な単発の bug fix 手順
- 一時的な workaround
- 特定モデルだけに効く prompt trick
- たまたま成功した探索順序
- current code の偶然の形
- 単一 route でしか通用しない naming の都合

ただし、単発に見えても
「なぜ失敗したか」「どうすれば成功したか」が今後の判断に効くなら、
`docs/exec-plans/completed/*.md` へ残す価値がある。

## Memory and Forgetting

この repo では次のように忘れる。

- route-local decisions は route 内に閉じ込める
- shared 層には抽象化された判断だけを残す
- temporary migration step は durable memory にしない
- premature な pattern 分割は忘れ、stable な責務だけを残す

ただし、route-local decision でも
同じ迷いが繰り返し発生したなら、それは local detail ではなく
harness gap である。
