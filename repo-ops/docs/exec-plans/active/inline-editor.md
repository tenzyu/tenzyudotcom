---
name: inline-editor
description: 公開ページの文脈を壊さず、管理者だけに局所的な編集 affordance を出す。
summary: notes を tweet-like な投稿 UX に寄せ、他 collection も三点リーダー起点の編集へ揃える。blog editor は入力領域を広くする。
read_when:
  - 公開ページ上の管理者向け編集体験を変更するとき
  - notes / pointers / puzzles / recommendations の運用 UX を見直すとき
  - blog editor の入力しづらさを改善するとき
execution-ready: true
---

## Goal

公開ページでは通常の閲覧体験を保ちつつ、管理者だけが各 item の三点リーダーから編集・削除できる状態にする。`notes` は tweet-like な軽い投稿 UX を持ち、`blog` の専用 editor は横幅と縦幅を十分に確保して書きやすくする。

## Scope

- 対象ページ
  - `notes`
  - `links`
  - `pointers`
  - `puzzles`
  - `recommendations`
  - `blog` editor
- 管理者判定は既存の `AdminGate` と `/api/auth/me` を継続利用する
- 保存・削除・revalidate は既存の editor action / repository を継続利用する
- `/:locale/editor/*` の専用 editor route は残す

## Deliverables

- `notes` の tweet-like 投稿仕様
- `links` `pointers` `puzzles` `recommendations` の三点リーダー型編集仕様
- `blog` editor の広い入力 UI 仕様
- 対応する product spec 更新
- 実装時に従う verification 条件

## Task Breakdown

1. notes の公開表示と admin 操作を同居させる新仕様へ置き換える
2. links / pointers / puzzles / recommendations を notes と同じ操作モデルへ揃える
3. blog editor の入力 UI を広げる仕様へ置き換える
4. product-specs 側へ移せる内容を転記する
5. 実装時の完了条件と確認項目を新仕様へ合わせて更新する

## Functional Spec

### 1. 共通方針

- 非管理者には公開 UI のみを表示する
- 管理者には各 item の近傍に三点リーダー型の操作入口を出す
- 三点リーダーから開く dropdown には少なくとも `編集` と `削除` を出す
- `削除` は即時実行せず、確認 UI を挟む
- `編集` は item 単位の軽量な編集 UI を開く
- 大きな admin 専用 box をページ下部に常設しない
- ページ本体の静的配信契約を壊さない

### 2. Notes

- 通常時は tweet のように短文の一覧を表示する
- 管理者時のみ各 note の右上または近傍に縦の三点リーダーを表示する
- dropdown actions:
  - 編集
  - 削除
- 編集で開く UI:
  - `body` 編集
  - `published` 編集
- 削除では確認 UI を必須にする
- `createdAt` と `updatedAt` は手入力させない
- `External URL` は notes では表示しないし、主要入力項目にも含めない
- 追加導線は tweet button のような primary CTA にする
- 新規投稿の入力は `body` のみでよい
- `en` が未入力なら `ja` をそのまま表示してよい
- 表示順は時系列のまま維持する

### 3. Links / Pointers / Puzzles / Recommendations

- notes と同じく、公開 item を通常表示しつつ、管理者だけ三点リーダーを出す
- dropdown actions:
  - 編集
  - 削除
- 削除は確認 UI を必須にする
- 編集 UI は item 単位の軽量編集にする
- item の公開表示を壊す大きな form 常設は不可
- locale 別文言を持つ場合、未入力 locale は既存 locale の値を fallback 表示してよい
- 追加導線はページ上部またはセクション上部に 1 つの primary CTA を置く

### 4. Blog Editor

- blog 一覧から専用 editor に入る導線は維持する
- blog editor の各種 input / textarea は狭くしない
- metadata input 群は広い横幅を使ってよい
- MDX editor は「全文が読みやすい」ことを優先し、縦幅を大きく取る
- 少なくとも初期表示時点で、スクロールしなくても本文の文脈が読める程度の高さを持たせる

## Product Decisions

- notes は「Twitter / Bluesky 代替の短文ログ」という役割をより強める
- notes の運用コストを下げるため、多言語入力の厳格性より投稿速度を優先する
- links / pointers / puzzles / recommendations も、閲覧 UI と編集 UI を分離しすぎず、item 単位で直せることを優先する
- blog だけは専用 editor を残し、その代わり authoring comfort を優先する

## Subagent Contract

- plan path: `docs/exec-plans/active/inline-editor.md`
- allowed file scope:
- `src/app/[locale]/(main)/**`
  - `src/app/[locale]/(admin)/editor/**`
  - `src/features/admin/**`
  - `src/features/links/**`
  - `docs/product-specs/site/**`
  - `docs/design-docs/rules/**`
- required verification:
  - `bun run lint`
  - `bun run build`
- expected return format:
  - changed files
  - user-visible behavior
  - verification result
  - follow-up if any

## Verification

- `notes` は通常の呟き一覧として見え、管理者だけ三点リーダーが見えること
- `notes` の新規投稿は body だけで完結すること
- `notes` の編集で `body` と `published` だけを触れること
- `notes` の削除で確認 UI が出ること
- `links` `pointers` `puzzles` `recommendations` でも item 単位に編集・削除できること
- `blog` editor の input 幅と MDX textarea 高さが十分に広がっていること
- `bun run lint`
- `bun run build`

## Completion Signal

- notes の日常運用が tweet-like に軽くなっている
- item 単位の三点リーダー編集へ操作モデルが揃っている
- blog editor が「触りにくい」状態から脱している
- product-specs と exec-plan の内容が一致している

## References

- [](/docs/product-specs/site/admin-editor-spec.md)
- [](/docs/product-specs/site/notes-product-spec.md)
- [](/docs/product-specs/site/blog-product-spec.md)
- [](/docs/product-specs/site/links-product-spec.md)
- [](/docs/product-specs/site/architecture.md)
- [](/docs/design-docs/rules/admin-gate-pattern.md)
