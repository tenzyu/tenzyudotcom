---
name: format-note-timestamps
description: 作業済みタスク：noteのタイムスタンプをアクティブなロケールに合わせてフォーマットする修正の記録。
summary: "[P3] 英語ページに切り替えても日本語のタイムスタンプフォーマットが残る回帰バグの修正。"
read_when:
  - タイムスタンプの日付フォーマットや、多言語対応の表示バグを直す時
skip_when:
  - アプリケーション全体に影響しない単一のスタイル変更時
user-invocable: false
---

# Format note timestamps with the active locale

**対象ファイル**: `/home/tenzyu/Documents/tenzyudotcom/src/app/[locale]/(main)/notes/_features/notes-page-content.tsx`

英語（`en`）のノートページにおいて、タイムスタンプが引き続き `ja-JP` ベースでレンダリングされており、ページ全体が英語設定であっても日本式の日付フォーマットが見えてしまうという問題があった。
これは `/en/notes` 限定で発生していたが、新しいページでのユーザーから見える回帰バグ（regression）であったため、アクティブな現在のロケールに基づいたフォーマットが行われるよう修正した。
