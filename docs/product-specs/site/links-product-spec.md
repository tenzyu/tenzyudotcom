---
name: links-product-spec
description: リンクコレクションのための、リポジトリ固有のプロダクト仕様。
summary: /links機能のためのカテゴリ化戦略、動作、および構造的なルールを定義する。
read_when:
  - リンクページまたはリンクデータのスキーマを変更する時
  - リンクの新しいカテゴリを追加する時
  - 外部リンクのレンダリング方法や追跡方法を変更する時
skip_when:
  - 一般的なUIコンポーネントのスタイリングルールだけが必要な時
user-invocable: false
---

# Links Product Spec

## 1. Feature Role & Scope

`/links` ページは、個人的なおすすめ、技術的な参考資料、その他の興味深いサイトのコレクションを提供する。
単なるブックマークの連列ではなく、明確なカテゴリと意図を持って整理される「生きたキュレーション (living curation)」である。

## 2. Categorization Strategy

リンクは、訪問者にとってのコンテキストを提供する明確なカテゴリに分類されなければならない。
新しいリンクを追加する際は、既存の主要なカテゴリに適合するかを確認し、一時的または用途が狭すぎるカテゴリの増殖を避けること。

## 3. Structural & UX Rules

- **External Focus**: `/links` は外部リソースへのハブである。サイト内での回遊（アーカイブやブログ）とは異なり、訪問者がすぐに外部へ飛ぶことを前提としている。
- **Presentation**: リンク先が何であるかを端的に伝える description を付与する。
- **No Heavy Interactions**: リンクの一覧表示はシンプルさを優先する。複雑なフィルタリングやソートよりも、静的で読みやすいカテゴリ分けを優先する。

## 4. Admin Interaction

- 公開ページでは通常のリンク一覧をそのまま表示する
- 管理者時のみ item 近傍に三点リーダーを表示する
- dropdown から `編集` と `削除` を行う
- 削除は確認 UI を必須にする
- 大きな admin form をページ下部に常設しない
- 新規追加はページ上部またはセクション上部の primary CTA から行う

この操作モデルは、同じ curated list 系である `pointers` `puzzles` `recommendations` にも準用する。

## 5. Guardrails (LLMs)

- **Do NOT** change the fundamental data source or rendering strategy without explicit product owner consent.
- **Do NOT** introduce unnecessary heavy client-side state for simple lists. Ensure server-side pre-rendering is maximally utilized.
