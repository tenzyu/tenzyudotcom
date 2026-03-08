---
name: harness-tools
description: Tool boundary and dependency guidance for the repo's harness. Read when deciding which tool, library, or runtime layer should own a responsibility.
user-invocable: false
---

# Tools

## Purpose

Tools は、エージェントが知性を発揮するための外部器官である。
責務分離された道具をどう組み合わせるかを定義する。

## When to Apply

この文書を読むのは次のとき。

- どの tool や library に責務を持たせるか決める
- Intlayer の境界を確認したい
- harness tool の使い方を見直したい
- replaceability を壊す依存がないか点検したい

## Workflow

tool 選定では次の順で判断する。

1. その責務は product tool か harness tool か
2. 既存の tool boundary を壊していないか
3. replaceability を落とす依存を増やしていないか
4. placement の話なら `structure.md` を参照する

### Framework

- Next.js App Router
- React Server Components / Client Components
- TypeScript

### i18n

- Intlayer
- next-intlayer

Intlayer は localized meaning のための tool として使う。

### UI

- shadcn primitives
- site shell components (`src/components/shell`)
- site-wide shared presentation (`src/components/site-ui`)
- feature components

shadcn/ui source は vendor-like primitive として扱う。

- `src/components/ui` から移動しない
- local-first を満たしたい場合でも、移動ではなく compose で対応する
- route や feature 固有の意味は wrapper / feature component 側へ載せる

### Content / Data

- MDX
- static dataset
- authored content

### Server Helpers

- `react` cache
- `fetch`
- parser / API helper
- external SDK wrapper

## Ownership Matrix

| Concern | Primary owner | Must not become |
| --- | --- | --- |
| localized labels / prose | Intlayer | fetch input registry |
| stable IDs / handles / URLs | `_data` or stable config | translated meaning store |
| site-wide presentation primitive | `src/components/site-ui` | domain-aware feature |
| shared capability UI | `src/features/<domain>` | site-ui primitive |
| human-edited canonical source | nearest feature-local `*.source.ts` | Intlayer dictionary |
| feature/page assembly | nearest feature-local `*.assemble.ts` | contract-only layer |
| route-local transform / loader | nearest route feature-local file, then `_features/lib` after growth | route root convenience bucket |
| cross-route shared logic / parser / API helper | `src/lib` | UI-aware helper layer |
| site-wide config / env / policy | `src/config` | feature-local dumping ground |
| page entry wiring | `page.tsx`, `layout.tsx`, convention files | feature implementation body |
| display sections | `_features/*` or `src/features/*` | syntax-first dumping ground |
| editorial storage / registry helper | `src/lib/editorial/*` | canonical source |

`src/config` の中でも責務を混ぜない。

- `site.ts`
  - site identity, canonical host, shared URL builder
- `site-policy.ts`
  - robots, sitemap, indexing policy, globally shared route policy
- `env.contract.ts`
  - environment parse / required credentials

## Editorial Boundary Vocabulary

editorial workflow では、
`source / content / contract / assemble / storage` を別境界として扱う。

- `*.source.ts`
  - human-authored canonical source
  - UI-ready shape ではない
  - 将来 Blob / DB / API に置き換わりうる
- `*.content.ts`
  - Intlayer meaning only
  - page / feature の fixed copy
  - source record や fetch input を持たない
- `*.contract.ts`
  - source / URL / env / external input を app が信頼できる shape に落とす
  - parse / normalize / validate を担う
  - view model assembly までは持たない
- `*.assemble.ts`
  - source / content / external fetch を束ねて feature / page data を作る
  - raw input validation を ad-hoc にやり直さない
- `src/lib/editorial/*`
  - shared storage / registry helper
  - canonical source の代わりにならない

### File-System Tools

- path naming conventions
- directory ownership
- file placement rules

フォルダ構造そのものを道具として使う。

### Search / Edit Tools

- `rg` for search
- `apply_patch` for precise edits
- non-destructive git inspection

repo に tests が入り始めたら、verification の入口も道具として揃える。

- `dev`
  - 安全な日常開発入口
- `dev:overlay`
  - remote overlay や extra tooling を明示的に opt-in するときだけ使う
- `test`
  - 日常的な test 実行入口
- `lint`
  - non-mutating な lint check
- `lint:fix`
  - 明示的に rewrite を伴う lint fix
- `typecheck`
  - build より速く type safety を確認する入口
- `verify:quick`
  - lint check / typecheck / targeted test を束ねる日常 verification
- `verify`
  - lint check / targeted test / build を束ねる repo-level 入口

ただし broad すぎる verify を毎回 mandatory にしない。
変更範囲に応じて targeted command を優先してよい。
また、unsafe な third-party 補助導線を `dev` の default にしない。

repo が `nix develop -c` を標準入口にしているなら、
automation や shell 外の verification でもその入口を優先する。

## Server / Client Boundary Hygiene

React / Next.js では、client を default にしない。

- route page content や content assembly はまず server に置く
- browser API, interaction state, `useSearchParams`, `useRouter` が必要な leaf だけ client にする
- URL state を読むためだけに page 全体を client 化しない
- server で集めた data を client へ渡すときは、serialize する値を最小化する
- simple disclosure や accordion 程度なら、まず native element で済まないか確認する
  - `details` / `summary` で足りるなら client primitive を増やさない

search params も境界として扱う。

- parse / normalize / serialize は feature-local の `*.contract.ts` に置く
- component 本体に query key や default 値を直書きしない
- view state の contract は route owner の近くで完結させる

## Outbound Boundary Hygiene

外向きの URL, embed, redirect も境界として扱う。

- cross-route で使う `http(s)` URL parse / normalize は `src/lib/url/*.contract.ts` に置く
- feature 固有の embed URL や remote host policy は feature owner の近くに置く
  - 例: YouTube embed / thumbnail builder は `src/features/youtube/*.contract.ts`
- `src/components/site-ui/ExternalLink` は validated な `http(s)` だけを受ける primitive にする
- custom scheme, app deep link, mailto は `ExternalLink` に混ぜない
  - feature-local な判断で別境界として扱う
- `window.open` する URI は ad-hoc に組み立て続けない
  - trusted builder か small helper を通す
  - 新規 window には `noopener,noreferrer` を付ける
- remote script を route/layout に差し込むなら、env contract で opt-in させる

## Freshness / Cache Hygiene

freshness policy は magic number のまま route entry や fetch call に散らさない。

- 1 route / 1 feature の freshness policy は、その owner の近くに置く
  - 例: `recommendations.cache-policy.ts`, `puzzles.cache-policy.ts`
- 複数 route や metadata route で共有される freshness policy だけを `src/config` に上げる
- `revalidate` export と `fetch(..., { next: { revalidate }})` は、同じ owner なら同じ policy constant を参照する
- timeout も freshness policy と同じ owner で管理してよい
- `react` の `cache()` は per-request dedupe 用であり、freshness source of truth の代わりにしない
- Next.js segment config export は framework 制約で inline literal が必要なことがある
  - import 共有できない場合は、segment export だけ inline に残し、fetch policy 側を source of truth にする

## Runtime Boundary Hygiene

外部 SDK や route-local loader も境界として扱う。

- external SDK wrapper は feature-local `lib` に閉じる
- component が raw SDK 呼び出しを直接持たない
- 同じ request で同じ call が起きうるなら、wrapper か loader 側で `cache()` による dedupe を入れる
- SDK 例外は wrapper 側で app の error shape に寄せる
- route page や server component は「何を読むか」を決め、SDK details は wrapper に委譲する

### Human Review Tools

- markdown design docs
- small, inspectable diffs
- file-local reasoning

## Tool Selection Rules

### Prefer

- narrow tools with explicit ownership
- stable path conventions over implicit runtime magic
- inspectable diff を作れる edit flow
- replaceable な markdown-first documentation

### Avoid

- monolithic global data bucket
- model-specific hidden prompt scaffolding
- data, i18n, fetching を 1 層に潰す library
- 外部 memory service 前提の設計

## Bundle / Discovery Hygiene

内部 code の barrel import は原則禁止にする。

- `index.ts` や `export *` で ownership を隠さない
- 同一 feature 内でも `./lib`, `./osu`, `@/lib/utils/index` のような省略 import は避ける
- import 先は具体 file を指し、探索経路を縮める

例外にしてよいのは、次のように境界自体が public entrypoint である場合だけ。

- 外部 package として公開する module の entrypoint
- framework が directory entry を前提にする箇所
- third-party 制約で file を直接指定できない箇所

bundle size と discovery の両方で得がない barrel は作らない。
特に app code では、短さより ownership の可視性を優先する。

## Tool Boundary Warnings

### Intlayer must not become

- a database
- a fetch input registry
- a global CMS for every static datum

### Harness tools must not become

- proprietary orchestration がないと維持できない仕組み
- 特定モデルだけが解釈できる暗黙ルール

## Replaceability

望ましい性質:

- path semantics are readable without custom runtime
- shared rules are documented in markdown
- feature boundaries survive model replacement
- a smaller model can still follow the structure
