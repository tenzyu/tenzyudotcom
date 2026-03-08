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

### Content / Data

- MDX
- static dataset
- authored content

### Server Helpers

- `react` cache
- `fetch`
- parser / API helper

## Ownership Matrix

| Concern | Primary owner | Must not become |
| --- | --- | --- |
| localized labels / prose | Intlayer | fetch input registry |
| stable IDs / handles / URLs | `_data` or stable config | translated meaning store |
| site-wide presentation primitive | `src/components/site-ui` | domain-aware feature |
| shared capability UI | `src/features/<domain>` | site-ui primitive |
| route-local transform / loader | route feature-local `lib` | route root convenience bucket |
| cross-route shared logic / parser / API helper | `src/lib` | UI-aware helper layer |
| site-wide config / env / policy | `src/config` | feature-local dumping ground |
| page entry wiring | `page.tsx`, `layout.tsx`, convention files | feature implementation body |
| display sections | `_features/*` or `src/features/*` | syntax-first dumping ground |

`src/config` の中でも責務を混ぜない。

- `site.ts`
  - site identity, canonical host, shared URL builder
- `site-policy.ts`
  - robots, sitemap, indexing policy, globally shared route policy
- `env.contract.ts`
  - environment parse / required credentials

### File-System Tools

- path naming conventions
- directory ownership
- file placement rules

フォルダ構造そのものを道具として使う。

### Search / Edit Tools

- `rg` for search
- `apply_patch` for precise edits
- non-destructive git inspection

## Server / Client Boundary Hygiene

React / Next.js では、client を default にしない。

- route page content や content assembly はまず server に置く
- browser API, interaction state, `useSearchParams`, `useRouter` が必要な leaf だけ client にする
- URL state を読むためだけに page 全体を client 化しない
- server で集めた data を client へ渡すときは、serialize する値を最小化する

search params も境界として扱う。

- parse / normalize / serialize は feature-local の `*.contract.ts` に置く
- component 本体に query key や default 値を直書きしない
- view state の contract は route owner の近くで完結させる

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
