---
name: collection-specific-admin-form
description: 進行中のタスク：admin UIをコレクションごとの専用フォームに改修する。
summary: 現在のJSONエディタ方式から、直感的なコレクション単位のフォーム入力UIへの脱却を目指す。
read_when:
  - /editorial（Admin）配下の管理UIの実装を改善する時
skip_when:
  - 公開向けのユーザー読み取り画面のみを修正している時
user-invocable: false
---

# Collection Specific Admin Form (Follow-up)

現在 admin UI は JSON editor方式を採用しているが、データ構造や利用者の運用を簡略化するため、コレクション（例: links, portfolio, blog）ごとの専用 Form に改修する余地（Technical Debt）がある。
これを随時改善可能なタスクとして保留・トラッキングする。
