---
name: admin-product-spec
description: Repo-specific product spec for the self-only editorial admin.
summary: Defines the intended operating model, scope, constraints, and self-only locale stance for the site's editorial admin.
read_when:
  - changing the editorial admin scope or UX
  - deciding capabilities for author-only editing flows
  - evaluating auth, collection coverage, or editing ergonomics
skip_when:
  - you only need generic editorial boundary rules from harness references
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
