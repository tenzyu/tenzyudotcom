---
name: sort-notes-by-timestamp
description: 作業済みタスク：notesのソート順をISO文字列ではなくパース済みのタイムスタンプで並べ替える修正の記録。
summary: "[P2] タイムゾーンオフセットの違いで note の順序が崩れる不具合の解消。"
read_when:
  - note のソート順やタイムゾーンの扱いについて確認が必要な時
skip_when:
  - アプリケーションのUIデザインのみを修正している時
user-invocable: false
---

# Sort notes by parsed timestamps, not raw ISO strings

**対象ファイル**: `/home/tenzyu/Documents/tenzyudotcom/src/app/[locale]/(main)/notes/_features/notes.assemble.ts`

ISO文字列のままソートを行うと、タイムゾーンオフセットが混在したデータの場合に問題が起きていた。
Admin エディタは `new Date().toISOString()`（`Z`）で新しい行をシードするが、チェックイン済みのデータは `+09:00` を使用していたため、単純な文字列比較を使うと newer な note が古い note の下に配置されてしまっていた（バリデーションは通過するにもかかわらず）。

解決策として、生の文字列ではなく、日付を正しくパースしたタイムスタンプ値に基づいてソートを行うよう修正した。
