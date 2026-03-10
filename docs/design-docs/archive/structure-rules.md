---
name: harness-structure
description: リポジトリのターゲットファイルシステムと所有権モデル。
read_when:
  - コードやデータを新規作成、移動、昇格、降格、または分類する時
user-invocable: false
---

# Structure

## Purpose

Structure は、この repo が収束すべき target filesystem と ownership model の正本を定義する。
主題は「どこに置くか」であり、原理の優先順位は `docs/design-docs/core-beliefs.md` で先に解く。

## Directory Semantics

主要ディレクトリは次の意味で固定する。

`docs/design-docs/*`
開発手順や設計上の判断軸を設置する。
コードを読むだけではわからないものを明文化して、暗黙知を減らすことが目的。

`docs/product-specs/*`
route / product area 固有の要求を置く
route 配下の文脈に迷ったときの第一候補

`docs/exec-plans/active/*`
進行中 task の `*.plan.md` / ExecPlan を置く
実行計画ドキュメント自体を第一級アーティファクトとして扱い、進捗と意思決定のログを残す
作業中 task の source of truth の第一候補

`docs/exec-plans/completed/*`
完了した task の意思決定ログを置く
新規 handoff の入力には使わない
過去判断の参照先の第一候補

`docs/generated`
AIの生成物を置く
調査やセッションを通しての報告書など

`docs/workflows/*`
繰り返し使う進め方を置く
task 本体や外部 reference は置かない
process に迷った時の第一候補

`docs/references/*`
外部ツール、外部サービス、外部実行環境との接続手順を置く
repo 内 ownership rule は置かない
external integration の確認時の第一候補

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
  - vendor-like source としてここに固定する
- `src/config`
  - site-wide shared config, env parse, feature flag, policy, limit
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
  - external URL, search params, embed input, frontmatter も contract に含む
- ops
  - webhook / cron / queue / batch のような non-route runtime
  - 現在 repo に常設しないなら、受け皿を premature に作らず gap として保留する

## Path Semantics

`components`, `hooks`, `lib`, `data` は top-level の分類軸ではない。
feature を先に決めたあと、その内部を整理するために使う。

ただし `src/components/shell`, `src/components/site-ui`, `src/config`, `src/lib/editorial` は sanctioned exception である。

- `src/components/shell`
  - site shell そのもの
  - route content や business feature を置かない
- `src/components/site-ui`
  - shell ではない site-wide shared presentation
  - data shape、workflow rule、domain knowledge を持たない primitive に限る
  - domain knowledge を持った瞬間に `src/features/<domain>` へ送る
- `src/components/ui`
  - shadcn/ui source の定位置
  - local-first を理由に feature 配下へ移動しない
  - 触るときは `components/ui` に残したまま compose する
- `src/config`
  - site identity、env parse、feature flag、limit、policy の single source of truth
  - route-local option や page-specific constant を置かない
  - generic な dumping ground にしない
- `src/lib/editorial`
  - public assemble と admin が共有する editorial storage / registry の置き場
  - route-private admin helper の置き場ではない

- `src/app`
  - route entry と route-private world の置き場
  - cross-route shared owner の第一候補ではない
- `src/features`
  - 複数 route で再利用される domain feature の置き場
  - shell や vendor primitive の置き場ではない
- `src/lib`
  - cross-route pure logic の置き場
  - page-local transform や feature-private helper の第一候補ではない
- `src/config`
  - site-wide policy と env parse の置き場
  - route-local data の置き場ではない
- `src/content`
  - authored content の置き場
  - runtime helper や shared config の置き場ではない

- `components`
  - feature 配下の section UI
- `hooks`
  - feature 配下で閉じる behavior hook
- `lib`
  - feature 配下で閉じる helper / transform / fetch helper
- `data`
  - stable identifiers / URLs / handles / static dataset

## Editorial Authoring Files

author-curated collection では、次の語彙を優先する。

- `*.source.ts`
  - 人が編集する canonical source
  - 将来 DB / CMS / Blob / API に置き換わりうる
  - self-curated collection では、item-level localized note を同居させてよい
    - page-level meaning は `*.content.ts` に残す
- `*.content.ts`
  - Intlayer meaning
  - page や feature の fixed copy
- `*.contract.ts`
  - boundary contract
  - parse / normalize / validate
- `*.assemble.ts`
  - source / content / contract / external fetch を束ねて
    feature や page の shape を作る

`*.data.ts` や `*.copy.ts` は broad すぎるため、
新規の author-curated collection では主語彙にしない。

`src/config` に置いてよいもの:

- `env.contract.ts`
- `site.ts`
- `site-policy.ts`
- site-wide pricing / limit / role / feature-flag config

`src/config` に置かないもの:

- route 1 個だけが使う option
- feature-local static dataset
- request ごとに変わる runtime state

feature 名なしで目的 code に辿る必要がある path は増やさない。

`src/components/features` は作らない。
domain-aware shared component は `src/features/<domain>` に置く。
`src/features/<domain>` 同士の依存は極力避け、必要なら shell か route entry で compose する。

## Small Features Stay Flat

route-local feature や小さな shared feature は、4〜5 files 程度までは flat に保つ。
探索しやすさを優先し、先に `lib/`, `data/`, `components/` を作らない。

優先順:

1. `<feature>.tsx`
2. `<feature>.source.ts`
3. `<feature>.content.ts`
4. `<feature>.assemble.ts` / `<feature>.metadata.ts`

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
  - 例: `<route>/_features/<feature>.source.ts` や `<route>/_features/<feature>-*.tsx` の隣
- 2 の場合
  - `<route>/_features/lib/*`
- 3 の場合
  - route の外へ promote し、shared feature か `src/lib` を検討する

優先順位としては、
`specific feature local > route-shared within _features > cross-route shared`
である。

`_features/lib` は route 内 shared のための最小 bucket であり、
「file 数が少ないが一旦整理したい」ための置き場ではない。

迷った時の第一候補は次の順で狭く取る。

1. `src/app/[locale]/.../<route>/_features/<feature>*`
2. `src/app/[locale]/.../<route>/_features/lib/*`
3. `src/features/<domain>/*`
4. `src/lib/*`

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
- `route.ts`

`page.tsx` などに残してよい責務:

- `params`, `searchParams`, `locale` の受け取り
- `notFound`, `redirect` の最終判断
- provider や route-level layout の接続
- route-local loader / builder の呼び出し
- page content component の render
- non-UI HTTP endpoint の request / response wiring

`page.tsx` などから出す責務:

- fetch 後の `map`, `filter`, `slice`, `Object.fromEntries`
- view model への整形
- Intlayer と identifiers data の合成
- SEO metadata や JSON-LD の組み立て
- page-only editorial structure の構築

置き場所の目安:

- 表示本体は `<route>/_features/*`
- route 内で共有する transform / loader / builder は `<route>/_features/<feature>.assemble.ts` か `<route>/_features/<name>.ts` を第一候補にする
  - file 数が増えたときだけ `<route>/_features/lib/*`
- stable identifiers は owner に従う
  - author-curated source なら `<route>/_features/<feature>.source.ts`
  - route 全体の source of truth なら `<route>/_data/<domain>.ts`

ただし `_features/lib` より近い feature-local な置き場があるなら、
まずそちらを使う。

route convention file は「受ける・つなぐ・委譲する」に留める。
「集める・変換する・構築する」を抱え始めたら、entry が厚すぎる。

`route.ts` は App Router でも使えるが、
non-UI HTTP endpoint が必要なときだけ作る。

- webhook
- feed
- signed callback
- redirect endpoint

必要がない限り、受け皿だけ先に作らない。

## Framework Runtime Entry Files

`proxy.ts` は route owner ではなく、
framework request entry として扱う。

- 置き場所は project root か `src/`
- locale routing、rewrite、redirect、request gate のような front-door 制御に留める
- feature logic、data shaping、domain workflow を抱え込まない
- feature owner が必要な判断は、近い contract / config / feature helper へ委譲する

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
- shell と home が共有する top-level public route registry
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
  - `<feature>.source.ts`
- route 内の複数 feature や page content が共有する static data
  - `_data/<domain>.ts`
- cross-route shared static data
  - route 外へ promote

`page.data.ts` は owner が見えないので避ける。
author-curated collection では `page.source.ts` も避け、
`recommendations.source.ts`, `puzzles.source.ts` のように責務名を file 名に残す。

join は feature 側で行う。

- `data` は `id`, `href`, `url`, `order`, stable enum を持つ
- `*.content.ts` は `label`, `description`, localized prose を持つ
- component / loader は stable id で両者を join する
- index 順依存で join しない
- record ごとに optional field が揺れるなら、join 点で existence を guard する

locale path を持つ route では、user に見える IA 文言も meaning として扱う。

- section title
- card title
- visible description
- primary tab / filter label

これらは raw data に直書きしない。
ただし brand 名や locale-neutral な proper noun だけは data に残してよい。

典型:

  - `<feature>.source.ts` が item 配列を持つ
  - `<feature>.content.ts` が page/feature の meaning を持つ
  - `<feature>.assemble.ts` が source と content を join する

### 4. Shell, site-ui, and pure logic are separate escape hatches

`src/components/shell` は shell のためにだけ使う。
`src/components/site-ui` は shell ではない site-wide shared presentation のためにだけ使う。
`src/lib` は pure shared logic のためにだけ使う。

- route-only helper を `src/lib` に逃がさない
- page-specific UI を shell や `src/components/site-ui` に昇格させない
- business capability を `src/components/site-ui` に押し込まない
- ownership が曖昧な convenience layer を増やさない

### 4.5. Mount point does not decide owner

mount point は「どこで render / compose されるか」であり、
owner は「どこが logic / contract / state / meaning を持つか」である。

- shell が mount point でも、capability owner は `src/features/<domain>` でよい
- `src/components/site-ui` は mount point になりうるが、owner にはならない
- provider が layout にいても、その stateful capability は feature owner に残してよい
- mount される場所より、変更責務と workflow の owner を優先する

### 4.6. Editorial storage and admin do not decide owner

editorial storage や admin route は「どこから source を読むか／編集するか」であり、
owner は「どこに canonical source があるか」である。

- route-local の source を shared owner に見せかけない
- shared feature の source でも、admin helper から product runtime import source を逆転させない
- `src/lib/editorial` は storage / registry の shared helper であり、canonical source ではない

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
- search params や URL state の parse / serialize
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

top-level public route registry は narrow shared data として扱う。

- 置き場所は `src/features/site-navigation/*.data.ts`
- 持ってよいのは `id`, `href`, group, primary-nav order のような discovery 用 stable data まで
- `metadata`, `page lead`, section copy, localized prose まで同居させない

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

- `src/features/<domain>/*`
- `src/components/shell/*`
- `src/components/site-ui/*`
- `src/lib/<domain>/<name>.ts`
- `src/config/site.ts`
- `src/config/<policy>.ts`

### Good local

- `src/app/[locale]/.../<route>/_features/<feature>.tsx`
- `src/app/[locale]/.../<route>/_features/<feature>.source.ts`
- `src/app/[locale]/.../<route>/_features/<feature>.assemble.ts`
- `src/app/[locale]/.../<route>/_features/lib/<name>.ts`
- `src/app/[locale]/.../<route>/_data/<domain>.ts`

### Smells

- shared feature が page dictionary を読む
- route 配下からしか使わない helper が `src/lib` にある
- route root に `_lib` を生やして feature 外の convenience bucket を作る
- 1 feature しか使わない helper を reflex で `_features/lib` に置く
- `src/lib/editorial` を canonical source の代わりに扱う
- `*.content.ts` に record や fetch input が入っている
- `*.contract.ts` が page 用 view model まで組み立てている
- `*.assemble.ts` が raw input を ad-hoc に validate している
- `page.tsx` が route-local transform や SEO assembly を抱えている
- shell だけが使う component が `src/components/site-ui` にある
- feature 固有の UI が `src/components/site-ui` にある
- 1 feature 専用の static data が route root の `_data` にある
- `src/components`, `src/hooks`, `src/utils` が feature 軸を押しのける
- `src/content/data` のような曖昧な共有フォルダを増やす
