# Editorial Architecture

## Scope

この文書は、この repo における author-curated collection と editorial admin の
運用設計書である。

対象:

- `recommendations`
- `notes`
- `puzzles`
- `links`
- `pointers`

## Canonical Model

この repo では、author-curated collection を次の語彙で扱う。

- `*.source.ts`
  - canonical source
  - 人が編集する主入口
  - 将来 Blob / DB / API に置き換わりうる
- `*.content.ts`
  - Intlayer meaning
  - page / feature の fixed copy
- `*.contract.ts`
  - boundary contract
  - parse / normalize / validate
- `*.assemble.ts`
  - source / content / external fetch を束ねて page / feature 用 data を作る

`*.data.ts` と `*.copy.ts` は新規の主語彙として使わない。

## Ownership

- canonical source は nearest feature owner の近くに置く
- admin route は source owner ではない
- `src/lib/editorial/*` は shared storage / registry helper であり、canonical source ではない

## Admin

- route は `/:locale/editorial/*`
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

### Notes

- Twitter / Bluesky 代替の短文ログ
- `blog` とは分ける
- primary nav には入れない
- home / navigation tiles など discovery 面で expose する

### Puzzles / Links / Pointers

- collection-specific form editor を育てる
- JSON fallback は後回し

## Failure Policy

- not-found だけを fallback にしてよい
- invalid-data / parse failure / storage outage は fail-open しない
- save には optimistic concurrency を入れる

## Open Questions

- auth を SaaS に寄せるタイミング
- Blob から DB へ昇格する条件
- notes image upload の media pipeline
