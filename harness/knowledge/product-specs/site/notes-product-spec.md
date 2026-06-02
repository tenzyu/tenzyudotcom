---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.site.notes
title: Notes Product Spec
status: active
summary: ノーツコレクションの役割、ルートの表面、ソースの形状、UX、およびadminスコープを定義する。
tags:
  - site
  - notes
  - product-spec
read_when:
  - ノーツの動作、情報設計、または編集モデルを変更する時
  - ノーツのソースの形状やルートの露出を評価する時
  - ノーツ機能が現在必要か、それとも明示的にスコープ外かを決定する時
skip_when:
  - 一般的なルートローカルの実装ルールだけが必要な時
x:
  legacy:
    name: notes-product-spec
    description: ノーツ機能のための、リポジトリ固有のプロダクト仕様。
    user_invocable: false
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
- public detail: `/:locale/notes/:id`
- admin: `/:locale/editor/notes`

## Source Shape

最小 shape:

- `id`
- `body`
- `createdAt`
- `parentId?`
- `externalUrl?`
- `imageUrl?`
- `published`
- `updatedAt?`

`body` は localized text とする。

## UX

page lead は「短文ログ」「Twitter の代替」であることが分かる文言にする。

表示は:

- reverse chronological list
- top-level note を reverse chronological に並べる
- thread 内は親の直後に子 note を古い順で表示する
- thread 内 item 間の separator は消し、avatar column の connector で親子関係を示す
- 子 note はインデントで階層を示す
- timestamp
- body
- `en` が未入力なら `ja` をそのまま表示してよい
- 公開ページでは external link を主表示要素にしない
- 公開ページでは image を主表示要素にしない

詳細 page は共有前提の単独 view とし、target note と thread 文脈を見せる。

## Admin

公開ページ上の item 単位編集を主とする。

- 管理者時のみ各 note に縦の三点リーダーを表示する
- dropdown には `編集` と `削除` を出す
- 削除は確認 UI を必須にする
- 編集 UI は note 単位で開き、入力項目は最小化する
- action row は share を基本にし、admin 時のみ reply と more を追加する

編集入力:

- body ja/en
- published

新規投稿:

- tweet button のような primary CTA から始める
- 新規入力は `body` のみでよい
- `createdAt` と `updatedAt` は自動で入れる
- externalUrl は notes の標準投稿フローでは要求しない
- 管理者は note 単位で「この note に続ける」投稿ができる
- 既存 note は editor とインライン編集から親 note を選び直せる
- 親削除時は子 note を祖先側へ繰り上げる

## Non-goals for now

- likes
- comments
- multi-user auth
- media upload pipeline の高度化
