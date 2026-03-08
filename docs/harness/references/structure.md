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

この repo の target shape は、次の 6 層で理解する。

1. `route-local feature`
2. `shared feature`
3. `site shell`
4. `site-ui component`
5. `pure shared logic`
6. `authored content`

対応する主な置き場所は以下。

- `src/app/[locale]/.../<route>/_features/*`
  - 1 route 専用の feature
  - 必要なときだけ feature subdir や `lib` / `data` を足す
- `src/features/<domain>`
  - 複数 route で再利用される feature
- `src/components/shell`
  - Header, Footer, BreadcrumbNav, Container などサイト骨格
- `src/components/site-ui`
  - shell ではないが site 全体で共有される presentation component
  - 例: `PageHeader`, `SectionHeader`, `Content`, `ExternalLink`
- `src/components/ui`
  - shadcn primitives
- `src/lib`
  - cross-route の pure shared logic / API helper / parser
- `src/content`
  - MDX など人が管理する authored content

この 6 層は product code の owner を表す。
test と contract は主層を増やすものではなく、既存 owner に付随する補助層として扱う。

- test
  - owner を持つ code の近くに置く
  - feature や shared logic を鏡写しに検証する補助物
- contract
  - 境界で受け取る data shape を定義し、normalize / validate する補助物
  - 再利用前でも単一の定義が必要なら早めに置いてよい
- ops
  - webhook / cron / queue / batch のような non-route runtime
  - 現在 repo に常設しないなら、受け皿を premature に作らず gap として保留する

## Path Semantics

`components`, `hooks`, `lib`, `data` は top-level の分類軸ではない。
feature を先に決めたあと、その内部を整理するために使う。

ただし `src/components/shell` と `src/components/site-ui` は sanctioned exception である。

- `src/components/shell`
  - site shell そのもの
  - route content や business feature を置かない
- `src/components/site-ui`
  - shell ではない site-wide shared presentation
  - data shape、workflow rule、domain knowledge を持たない primitive に限る
  - domain knowledge を持った瞬間に `src/features/<domain>` へ送る

- `components`
  - feature 配下の section UI
- `hooks`
  - feature 配下で閉じる behavior hook
- `lib`
  - feature 配下で閉じる helper / transform / fetch helper
- `data`
  - stable identifiers / URLs / handles / static dataset

feature 名なしで目的 code に辿る必要がある path は増やさない。

`src/components/features` は作らない。
domain-aware shared component は `src/features/<domain>` に置く。
`src/features/<domain>` 同士の依存は極力避け、必要なら shell か route entry で compose する。

## Small Features Stay Flat

route-local feature や小さな shared feature は、4〜5 files 程度までは flat に保つ。
探索しやすさを優先し、先に `lib/`, `data/`, `components/` を作らない。

優先順:

1. `<feature>.tsx`
2. `<feature>.data.ts`
3. `<feature>.content.ts`
4. `<feature>.loader.ts` / `<feature>.metadata.ts`

次のどちらかが起きたら subdir を作る:

- 6 file 以上になり、読み筋が分かれ始めた
- 同じ feature 内で UI / data / loader の owner が明確に分離した

## Feature-Local Placement Order

route-local code の置き場は、次の順で狭く考える。
広い bucket を先に作らない。

1. 1 つの feature component 群だけが使う
2. 同一 route の複数 feature から使う
3. 複数 route から使う

対応する置き場所:

- 1 の場合
  - その feature の近くに置く
  - 例: `<route>/_features/<feature>.data.ts` や `<route>/_features/<feature>-*.tsx` の隣
- 2 の場合
  - `<route>/_features/lib/*`
- 3 の場合
  - route の外へ promote し、shared feature か `src/lib` を検討する

優先順位としては、
`specific feature local > route-shared within _features > cross-route shared`
である。

`_features/lib` は route 内 shared のための最小 bucket であり、
「file 数が少ないが一旦整理したい」ための置き場ではない。

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
- route 内で共有する transform / loader / builder は `<route>/_features/<name>.ts`
  - file 数が増えたときだけ `<route>/_features/lib/*`
- stable identifiers は owner に従う
  - 1 feature 専用なら `<route>/_features/<feature>.data.ts`
  - route 全体の source of truth なら `<route>/_data/<domain>.ts`

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
- site-wide shared component
- cross-route の pure helper

### 2. Promote only after reuse is real

shared に上げる条件は「再利用の可能性」ではなく「再利用の事実」である。

promote 対象の典型:

- 2 route 以上から参照される feature
- shell 全体から使われる UI
- shell ではないが site 全体で繰り返し使われる component
- sitemap / metadata / robots から共通利用される config
- cross-route の content loader

再利用の事実がない段階では local を優先する。

### 3. Intlayer stores meaning, data follows owner

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
ただし static であることだけを理由に route root の `_data` へ置かない。

- 1 feature しか使わない static data
  - `<feature>.data.ts`
- route 内の複数 feature や page content が共有する static data
  - `_data/<domain>.ts`
- cross-route shared static data
  - route 外へ promote

`page.data.ts` は owner が見えないので避ける。
`recommendations.data.ts`, `puzzles.data.ts`, `selfie-gallery.data.ts` のように、
責務名を file 名に残す。

### 4. Shell, site-ui, and pure logic are separate escape hatches

`src/components/shell` は shell のためにだけ使う。
`src/components/site-ui` は shell ではない site-wide shared presentation のためにだけ使う。
`src/lib` は pure shared logic のためにだけ使う。

- route-only helper を `src/lib` に逃がさない
- page-specific UI を shell や `src/components/site-ui` に昇格させない
- business capability を `src/components/site-ui` に押し込まない
- ownership が曖昧な convenience layer を増やさない

### 5. Syntax buckets are subordinate

`components`, `hooks`, `utils` のような構文名は、
feature と ownership の判断が終わった後にだけ使う。

避けたいもの:

- `src/components/*` が shared feature の代わりになること
- `src/hooks/*` が feature 境界を消すこと
- `src/utils/*` が ownership 不明の捨て場になること

### 6. Tests follow owners, not the other way around

test は feature や shared logic の owner を写す。
test のために新しい top-level bucket を主軸にしない。

優先順:

1. pure function / parser / builder の隣
2. feature-local loader / transform の隣
3. shared feature や `src/lib` の隣

置き方の目安:

- route-local feature の pure logic
  - `<feature>.test.ts`
  - `<feature>.data.test.ts`
  - `<feature>/lib/<name>.test.ts`
- shared logic
  - `src/lib/<domain>/<name>.test.ts`
  - `src/features/<domain>/<name>.test.ts`

この repo では、静的 page の見た目を snapshot で広く固定するより、
pure logic / parsing / metadata / contract を小さく検証する方を優先する。

e2e が未導入なら、`tests/e2e` のような受け皿を先に作らない。
まず「本当に継続運用するか」を決めてから導入する。

### 7. Contracts live at the boundary they defend

contract は、外から入る data や authored content の shape を定義する。
validation だけでなく normalize や parse も含む。

命名は `*.contract.ts` と `*.schema.ts` を基本にする。

- `*.contract.ts`
  - app が実際に受け入れる shape と normalize / guard
- `*.schema.ts`
  - schema object や validator definition が主役のとき

両方が必要なら、schema を `*.schema.ts`、
app-specific な parse / normalize を `*.contract.ts` に分ける。

この repo で contract と見なす典型:

- MDX frontmatter の schema
- external API response の normalize / guard
- static dataset record の shape
- env や config の parse
- JSON-LD や metadata builder の入力 shape

置き場所は owner に従う。

- 1 route 専用の境界
  - `<route>/_features/lib/<name>.contract.ts`
  - `<route>/_features/lib/<name>.schema.ts`
- shared boundary
  - `src/lib/<domain>/<name>.contract.ts`
  - `src/lib/<domain>/<name>.schema.ts`
- content loader 専用
  - loader の隣に置く

contract は `promote only after reuse is real` の例外になりうる。
理由は、再利用の有無より「唯一の定義であるべきか」が優先されるためである。

## Decision Order

新しい code を置く前に、次の順で判断する。

1. これは 1 route 専用か
2. 最上位の属性は feature / shell / site-ui component / pure logic / content のどれか
3. まず最も近い feature-local placement に置けるか
4. これは識別子データか、翻訳された意味内容か
5. 同時に読む / 直すものを近接配置できるか
6. すでに 2 箇所以上で使われているか
7. feature の内部で pattern 分割が本当に必要か

## Examples

### Good shared

- `src/features/links/*`
- `src/features/site-controls/*`
- `src/components/shell/*`
- `src/components/site-ui/*`
- `src/lib/blog/getBlogPosts.ts`
- `src/lib/intlayer/page.ts`
- `src/config/site.ts`

### Good local

- `src/app/[locale]/(main)/pointers/_features/dashboard/*`
- `src/app/[locale]/(main)/puzzles/_features/puzzles/*`
- `src/app/[locale]/(main)/recommendations/_features/recommendations/*`
- `src/app/[locale]/(main)/blog/_features/blog/*`
- `src/app/[locale]/(main)/blog/[slug]/_features/lib/blog-post.ts`
- `src/app/[locale]/(main)/puzzles/_features/puzzles.data.ts`
- `src/app/[locale]/(main)/recommendations/_features/recommendations.data.ts`
- `src/app/[locale]/(main)/archives/osu-profile/_features/lib/getUser.ts`
- `src/app/[locale]/(main)/archives/osu-profile/_data/youtube.ts`

### Smells

- shared feature が page dictionary を読む
- route 配下からしか使わない helper が `src/lib` にある
- route root に `_lib` を生やして feature 外の convenience bucket を作る
- 1 feature しか使わない helper を reflex で `_features/lib` に置く
- `page.tsx` が route-local transform や SEO assembly を抱えている
- shell だけが使う component が `src/components/site-ui` にある
- feature 固有の UI が `src/components/site-ui` にある
- 1 feature 専用の static data が route root の `_data` にある
- `src/components`, `src/hooks`, `src/utils` が feature 軸を押しのける
- `src/content/data` のような曖昧な共有フォルダを増やす
