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

## 4. Guardrails (LLMs)

- **Do NOT** change the fundamental data source or rendering strategy without explicit product owner consent.
- **Do NOT** introduce unnecessary heavy client-side state for simple lists. Ensure server-side pre-rendering is maximally utilized.
