---
name: admin-spec
description: 自分専用の、軽くて安全な編集画面を持つ
---

# Admin Spec

## Goal

自分専用の、軽くて安全な編集機能を持つ

## Requirements

**/login**
ログイン処理ができる。ログイン後は /editor にリダイレクトする。

**/editor**
- `storage/` または Vercel の Blob の内容を 追加・削除・編集 できる。
- ログアウトできる。

**/{blog,links,notes,pointers,puzzles,recommendations}**
- ログイン時にしか表示されない編集コンポーネントを設置して、実際に編集できる。

## Non-goals

- team collaboration
- role-based access control
- invite / org
- rich CMS
- rich login (e.g. google auth)

## UX Direction

- JSON editor を最終形にしない
- collection ごとの主入力面を育てる
- API / OGP / URL から埋められる値は自動補完する
- 「何を入れれば十分か」を最小にする

## Auth

- self-only
- deployed 環境から編集
- smartphone からも利用
- 将来は SaaS auth へ移行可能であること

## Risks

- self-hosted でないので storage / auth の platform dependency が強い
- fail-open fallback は避ける
- stale editor の後勝ち上書きは避ける
