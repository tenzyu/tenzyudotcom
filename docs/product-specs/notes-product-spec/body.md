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
- admin: `/:locale/editorial/notes`

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
