---
name: harness-improvement-loop
description: プロジェクトとharness自体を反復改善するための自己改善ループ用プロンプト集。
summary: "エージェントが設計思想とコードベースの暗黙知のズレを解消し、ドキュメントの鮮度を上げるためのタスク定義。"
read_when:
  - Harness Engineering自体のルールや構造の品質を底上げしたい時
  - エージェントに自己改善的リファクタリングを指示したい時
skip_when:
  - 新規機能の要件定義や直接的な実装作業を行っている時
user-invocable: true
---

# Harness Improvement Loop

この repo で、project と harness を反復改善するための prompt。

```text
このプロジェクトを見ながら、プロジェクト改善と harness 改善のループに入ってください。

前提:
- 最初に `AGENTS.md` を読んで routing してください。
- harness は単なる機能一覧ではなく、AI エージェント運用の判断基準です。
- current code ではなく target architecture を基準に評価してください。

1 周ごとにやること:
1. 現状の harness を読み、今回の task に必要な文書だけを追加で読む。
2. project を見て、構造・責務・verification・contract・meaning/data split の観点で改善点を見つける。
3. harness の価値基準、判断基準、設計思想から漏れている暗黙知があれば報告する。
4. 方向性がわからないところ、docs が足りず追加推論したところがあれば報告する。
   - user の価値観や運用思想が必要な論点なら、推測で進めず短いインタビューを挟む。
5. harness を更新した場合は、その更新内容を review する。
   - LLM にとって重要な情報が、1 か所で読める単位にまとまっているか
   - 既存文書と競合する思想がないか
   - 同じ概念が別名で増えていないか
   - README から辿れる routing になっているか
6. 今回の主観点を 1 つ明示する。次の loop では、直前と異なる観点を主軸にする。
   - 例: ownership / placement, contract / boundary, security / outbound boundary, verification, data freshness / caching, config, UX, performance, tooling
7. 改善オプションを 2〜4 個に絞って返す。推奨順も示す。
8. ユーザーが選んだオプションを harness に反映し、その基準で project にも実装を入れる。
9. 実装後は最低 1 つ以上の verification を通す。影響が route/data/config に及ぶなら build を優先する。
10. 何を promote / demote したか、どの structural decision を採ったか、未検証事項は何かを短く報告する。

ループ規律:
- `local-first, promote-later`
- `Feature-first, Pattern-later`
- Intlayer は meaning、stable identifiers は data
- barrel import は原則禁止
- contract は `*.contract.ts` / `*.schema.ts`
- harness gap を見つけたら、同じ task で安全に直せるなら docs に還元する

このループを、ユーザーが止めるまで繰り返してください。
```
