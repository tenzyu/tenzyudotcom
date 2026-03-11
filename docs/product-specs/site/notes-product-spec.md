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
- `updatedAt?`

`body` は localized text とする。

## UX

page lead は「短文ログ」「Twitter の代替」であることが分かる文言にする。

表示は:

- reverse chronological list
- timestamp
- body
- `en` が未入力なら `ja` をそのまま表示してよい
- 公開ページでは external link を主表示要素にしない
- 公開ページでは image を主表示要素にしない

個別 permalink page は後回し。

## Admin

公開ページ上の item 単位編集を主とする。

- 管理者時のみ各 note に縦の三点リーダーを表示する
- dropdown には `編集` と `削除` を出す
- 削除は確認 UI を必須にする
- 編集 UI は note 単位で開き、入力項目は最小化する

編集入力:

- body ja/en
- published

新規投稿:

- tweet button のような primary CTA から始める
- 新規入力は `body` のみでよい
- `createdAt` と `updatedAt` は自動で入れる
- externalUrl は notes の標準投稿フローでは要求しない

## Non-goals for now

- replies / threading
- likes
- comments
- multi-user auth
- media upload pipeline の高度化
