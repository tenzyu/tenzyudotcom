---
name: harness-structure
description: Target filesystem and ownership model for the repo. Read when creating, moving, promoting, demoting, or classifying code and data.
user-invocable: false
---

# Structure

## Purpose

Structure は、この repo が収束すべき target filesystem と ownership model を定義する。
主題は「どこに置くか」であり、原理の衝突は `context.md` で先に解く。

## When to Apply

この文書を読むのは次のとき。

- file を新規作成する
- file を移動、rename、promote、demote する
- shared と local の境界を決める
- Intlayer に入れるか `data` に置くか迷う
- `components`, `hooks`, `lib`, `data` の切り方を決める

## Core Model

この repo の target shape は、次の 5 層で理解する。

1. `route-local feature`
2. `shared feature`
3. `site shell`
4. `pure shared logic`
5. `authored content`

対応する主な置き場所は以下。

- `src/app/[locale]/.../<route>/_features/*`
  - 1 route 専用の feature
  - 必要なときだけ feature subdir や `lib` / `data` を足す
- `src/features/<domain>`
  - 複数 route で再利用される feature
- `src/components/site`
  - Header, Footer, Container などサイト骨格
- `src/components/ui`
  - shadcn primitives
- `src/lib`
  - cross-route の pure shared logic / API helper / parser
- `src/content`
  - MDX など人が管理する authored content

## Path Semantics

`components`, `hooks`, `lib`, `data` は top-level の分類軸ではない。
feature を先に決めたあと、その内部を整理するために使う。

- `components`
  - feature 配下の section UI
- `hooks`
  - feature 配下で閉じる behavior hook
- `lib`
  - feature 配下で閉じる helper / transform / fetch helper
- `data`
  - stable identifiers / URLs / handles / static dataset

feature 名なしで目的 code に辿る必要がある path は増やさない。

## Feature-Local Placement Order

route-local code の置き場は、次の順で狭く考える。
広い bucket を先に作らない。

1. 1 つの feature component 群だけが使う
2. 同一 route の複数 feature から使う
3. 複数 route から使う

対応する置き場所:

- 1 の場合
  - その feature の近くに置く
  - 例: `<route>/_features/<feature>/lib/*` または `<route>/_features/<feature>-*.tsx` の隣
- 2 の場合
  - `<route>/_features/lib/*`
- 3 の場合
  - route の外へ promote し、shared feature か `src/lib` を検討する

優先順位としては、
`specific feature local > route-shared within _features > cross-route shared`
である。

`_features/lib` は route 内 shared のための最小 bucket であり、
「feature がまだ曖昧だから一旦置く場所」ではない。

## Route Entry Files

Next.js の route convention file は feature 本体ではなく、
framework と route-local world を接続する entry として扱う。

対象:

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `generateMetadata`
- `generateStaticParams`

`page.tsx` などに残してよい責務:

- `params`, `searchParams`, `locale` の受け取り
- `notFound`, `redirect` の最終判断
- provider や route-level layout の接続
- route-local loader / builder の呼び出し
- page content component の render

`page.tsx` などから出す責務:

- fetch 後の `map`, `filter`, `slice`, `Object.fromEntries`
- view model への整形
- Intlayer と identifiers data の合成
- SEO metadata や JSON-LD の組み立て
- page-only editorial structure の構築

置き場所の目安:

- 表示本体は `<route>/_features/*`
- route 内で共有する transform / loader / builder は `<route>/_features/lib/*`
- stable identifiers は `<route>/_data/*`

ただし `_features/lib` より近い feature-local な置き場があるなら、
まずそちらを使う。

route convention file は「受ける・つなぐ・委譲する」に留める。
「集める・変換する・構築する」を抱え始めたら、entry が厚すぎる。

## Placement Rules

### 1. Route owns its private world

1 route でしか使わないものは route 配下に置く。

含まれるもの:

- section component
- page-specific static data
- route-specific fetching helper
- page-specific transform
- page-only editorial structure
- route entry から委譲される page-local loader / metadata builder

含まれないもの:

- 他 route から参照される UI
- site shell control
- cross-route の pure helper

### 2. Promote only after reuse is real

shared に上げる条件は「再利用の可能性」ではなく「再利用の事実」である。

promote 対象の典型:

- 2 route 以上から参照される feature
- shell 全体から使われる UI
- sitemap / metadata / robots から共通利用される config
- cross-route の content loader

再利用の事実がない段階では local を優先する。

### 3. Intlayer stores meaning, data stores identifiers

Intlayer に入れてよいもの:

- labels
- UI copy
- localized prose
- localized editorial structure

Intlayer に入れるべきでないもの:

- external IDs
- fetch input
- stable URLs
- shared identifiers

識別子の source of truth は `data` に寄せる。

### 4. Shell and pure logic are separate escape hatches

`src/components/site` は shell のためにだけ使う。
`src/lib` は pure shared logic のためにだけ使う。

- route-only helper を `src/lib` に逃がさない
- page-specific UI を shell に昇格させない
- ownership が曖昧な convenience layer を増やさない

### 5. Syntax buckets are subordinate

`components`, `hooks`, `utils` のような構文名は、
feature と ownership の判断が終わった後にだけ使う。

避けたいもの:

- `src/components/*` が shared feature の代わりになること
- `src/hooks/*` が feature 境界を消すこと
- `src/utils/*` が ownership 不明の捨て場になること

## Decision Order

新しい code を置く前に、次の順で判断する。

1. これは 1 route 専用か
2. 最上位の属性は feature / shell / pure logic / content のどれか
3. まず最も近い feature-local placement に置けるか
4. これは識別子データか、翻訳された意味内容か
5. 同時に読む / 直すものを近接配置できるか
6. すでに 2 箇所以上で使われているか
7. feature の内部で pattern 分割が本当に必要か

## Examples

### Good shared

- `src/features/links/*`
- `src/features/site-controls/*`
- `src/lib/blog/getBlogPosts.ts`
- `src/lib/intlayer/page.ts`
- `src/config/site.ts`

### Good local

- `src/app/[locale]/(main)/pointers/_features/dashboard/*`
- `src/app/[locale]/(main)/puzzles/_features/puzzles/*`
- `src/app/[locale]/(main)/recommendations/_features/recommendations/*`
- `src/app/[locale]/(main)/blog/_features/blog/*`
- `src/app/[locale]/(main)/blog/[slug]/_features/lib/blog-post.ts`
- `src/app/[locale]/(main)/puzzles/_features/lib/get-puzzle-categories-with-ogp.ts`
- `src/app/[locale]/(main)/archives/osu-profile/_features/lib/getUser.ts`

### Smells

- shared feature が page dictionary を読む
- route 配下からしか使わない helper が `src/lib` にある
- route root に `_lib` を生やして feature 外の convenience bucket を作る
- 1 feature しか使わない helper を reflex で `_features/lib` に置く
- `page.tsx` が route-local transform や SEO assembly を抱えている
- `src/components`, `src/hooks`, `src/utils` が feature 軸を押しのける
- `src/content/data` のような曖昧な共有フォルダを増やす
