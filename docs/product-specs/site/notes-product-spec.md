---
name: notes-product-spec
description: ノーツ機能のための、リポジトリ固有のプロダクト仕様。
summary: ノーツコレクションの役割、ルートの表面、ソースの形状、UX、およびadminスコープを定義する。
read_when:
  - ノーツの動作、情報設計、または編集モデルを変更する時
  - ノーツのソースの形状やルートの露出を評価する時
  - ノーツ機能が現在必要か、それとも明示的にスコープ外かを決定する時
skip_when:
  - 一般的なルートローカルの実装ルールだけが必要な時
user-invocable: false
---

# Notes Product Spec

## Purpose

`notes` は、このサイトにおける Twitter / Bluesky 代替の短文ログである。
どうでもいいこと、思いつき、短い観測、リンク付きメモを気軽に書き残す場とする。

## Positioning

- `blog`
  - 長文
  - まとまった記事
  - 読ませる
- `notes`
  - 短文
  - 時系列
  - 呟く / 残す

## Discovery

- primary nav には入れない
- navigation tiles には入れる
- 必要なら home から最新数件だけ見せる

## Route

- public: `/:locale/notes`
- admin: `/:locale/editor/notes`

## Source Shape

最小 shape:

- `body`
- `createdAt`
- `externalUrl?`
- `imageUrl?`
- `published`

`body` は localized text とする。

## UX

page lead は「短文ログ」「Twitter の代替」であることが分かる文言にする。

表示は:

- reverse chronological list
- timestamp
- body
- optional external link
- optional image

個別 permalink page は後回し。

## Admin

専用 form editor を持つ。

入力:

- body ja/en
- createdAt
- externalUrl
- imageUrl
- published

## Non-goals for now

- replies / threading
- likes
- comments
- multi-user auth
- media upload pipeline の高度化
