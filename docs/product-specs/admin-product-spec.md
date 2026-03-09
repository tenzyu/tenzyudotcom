---
name: admin-product-spec
description: 自分専用のeditorial adminのための、リポジトリ固有のプロダクト仕様。
summary: サイトのeditorial adminの意図された運用モデル、スコープ、制約、および自分専用のロケール方針を定義する。
read_when:
  - editorial adminのスコープやUXを変更する時
  - 著者専用の編集フローのための機能を決定する時
  - 認証、コレクションのカバレッジ、または編集のエルゴノミクスを評価する時
skip_when:
  - harnessの参照から一般的なeditorial boundary（境界）ルールだけが必要な時
user-invocable: false
---

# Admin Product Spec

## Goal

自分専用の、軽くて安全な editorial admin を持つ。

## Requirements

- deployed 環境から編集できる
- mobile からも使える
- collection-specific form を持つ
- save 後に public route を revalidate する
- version conflict を検知する

## Non-goals

- team collaboration
- role-based access control
- invite / org
- rich CMS

## Collections

- recommendations
- notes
- puzzles
- links
- pointers

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
