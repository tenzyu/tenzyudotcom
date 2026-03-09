---
name: sync-recommendation-previews
description: 作業済みタスク：recommendationプレビューのインデックスずれを修正した記録。
summary: "[P2] 行のドラッグや追加、削除時にプレビュー表示が追従せず、別々のプレビューが表示される問題の修正。"
read_when:
  - Adminエディタのコンポーネント（特にドラッグ＆ドロップ、プレビュー）を修正する時
skip_when:
  - 一般ユーザー向けのPublicページのみを修正している時
user-invocable: false
---

# Keep recommendation previews in sync with edited rows

**対象ファイル**: `/home/tenzyu/Documents/tenzyudotcom/src/app/[locale]/(admin)/editorial/_features/recommendations-editor-client.tsx`

`previews` がサーバー側からレンダリングされた初期値で一度だけ計算されていたが、クライアント側で管理者が行の順番を入れ替え（reorder）、削除（remove）、追加、編集することが可能であった。
UIが依然として `previews[index]` を読み取っていたため、プレビューのテキストがすぐに行本体とずれてしまい、移動/削除、またはURL変更後にエディタが間違ったビデオ/チャンネルのプレビューを表示してしまっていた。

これを、編集された行に正しくプレビューが同期し続けるように修正した。
