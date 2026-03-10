---
name: admin-spec
description: 自分専用の、軽くて安全な編集画面を持つ
---

# Admin Spec

## Goal

自分専用の、軽くて安全な編集機能を持つ

## Requirements

**/login**
- ログイン処理ができる。
- ログイン後は `/editor` にリダイレクトする。
- セキュリティを考慮した認証実装。

**/editor**
- `storage/` または Vercel の Blob の内容を 追加・削除・編集 できる。
- ログアウトできる。
- スマートフォンからも快適に利用可能。
- 入力項目（URL等）からの OGP / API を利用した自動補完。
- 複数端末・セッションでの「後勝ち」を避けるための上書き防止（Conflict 検出）。

**/{blog,links,notes,pointers,puzzles,recommendations}**
- ログイン時にのみ「編集ページへのリンク（鉛筆アイコン）」が表示される。
- 各ページのコンテンツを迅速に編集画面へ引き継げる。

## Non-goals

- team collaboration
- role-based access control
- invite / org
- rich CMS
- rich login (e.g. google auth)

## UX Direction

- JSON editor を最終形にしない。
- collection ごとの主入力面（フォームベースのUI）を育てる。
- API / OGP / URL から埋められる値は自動補完する。
- 「何を入れれば十分か」を最小にする。
- スマートフォンでの片手操作を考慮したUI。

## Auth

- self-only (個人利用限定)
- deployed 環境から編集
- smartphone からも利用
- 将来は SaaS auth へ移行可能であること。

## Risks

- self-hosted でないので storage / auth の platform dependency が強い。
- fail-open fallback は避ける。
- stale editor の後勝ち上書きは避ける（Version Conflict 処理を徹底する）。
- セキュリティ的な脆弱性（XSS, CSRF, 不正アクセス）を排除する。
