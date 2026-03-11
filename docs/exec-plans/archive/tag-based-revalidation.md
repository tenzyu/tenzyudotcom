---
name: tag-based-revalidation
description: 進行中のタスク：Revalidation手法を path-based から tag-based へ移行する検討。
summary: コレクション数やルートの増大に備え、より保守性の高い Next.js キャッシュ再構築戦略に変更する。
read_when:
  - Next.js の Revalidation や Cache（ISR）のロジックについてリファクタリングを計画する時
skip_when:
  - 単純な静的ページの追加等を行っている時
user-invocable: false
---

# Tag-Based Revalidation Consideration (Follow-up)

現在の戦略では、Adminデータの保存後に `revalidatePath` を使って特定のAffected Pageを無効化（path-based revalidation）している。

将来的にはコレクション数やダイナミックルートの数が増大した際、tag-based revalidation を使用したほうがキャッシュ操作の粒度と保守性が良くなる可能性があるため、将来的な改修検討課題（TODO）とする。
