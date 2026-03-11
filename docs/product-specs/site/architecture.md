---
name: editor-architecture
description: 著者主導のEditorコレクションのための、リポジトリ固有のアーキテクチャノート。
---

# Editor Architecture

## Scope

この文書は、この repo における author-curated collection と Editor admin の
運用設計書である。

対象:

- `recommendations`
- `notes`
- `puzzles`
- `links`
- `pointers`

## Boundary Baseline

Editor の一般語彙は `docs/design-docs/tools-boundary.md` を正とする。
この文書では、この repo 固有の運用前提だけを追加する。

## Ownership

- canonical source は nearest feature owner の近くに置く
- admin route は source owner ではない
- `src/lib/editor/*` は shared storage / registry helper であり、canonical source ではない

## Admin

- route は `/:locale/editor/*`
- self-only admin
- 普段の編集は desktop / mobile の両方から行う
- deployed 環境でも編集する前提

required capabilities:

- secure login
- collection-specific form editor
- save + public route revalidation
- version conflict detection

## Storage

- 当面は Vercel Blob を primary storage にする
- local fallback は development / emergency 用とする
- source schema は Blob 前提で壊れないように保つ

## Editing UX

- JSON editor は fallback であり、優先度は低い
- 主要 collection は collection-specific form を育てる
- 入力項目は人間の意図に寄せる
  - URL
  - note
  - publish
  - order
  - 例外的 override
- API や OGP から取れる値は極力自動補完する

## Collection-specific Rules

### Recommendations

- video は `URL + note + published` を最小入力とする
- channel も最終的には `URL + note + published` を最小入力に寄せる
- title / handle / thumbnail / videoId は極力自動補完する
