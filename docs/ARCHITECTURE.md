---
name: harness-architecture
description: システムレベルのドメイン・パッケージ階層図とアーキテクチャの基本原則。
summary: 6層のプロダクトコード所有権モデルと、パスセマンティクスによるディレクトリ責務の分割ルールを定義する。
read_when:
  - コンポーネントやフィーチャーの配置場所（ディレクトリ）を決定する時
  - サイト全体の所有権モデルや境界ルールについて確認する時
skip_when:
  - 特定のコンポーネント内での微小なスタイル変更や内部ロジックのみを修正する時
user-invocable: false
---

# Architecture (ARCHITECTURE)

この文書は LLM 向けの要約である。
配置ルールの正本は `docs/design-docs/structure-rules.md`、運用 guard の要約は `docs/GUARDRAILS.md` を使う。

## 1. Core Model (所有権モデル)

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

## 2. Path Semantics (パスのセマンティクス)

`components`, `hooks`, `lib`, `data` は top-level の分類軸ではない。
feature を先に決めたあと、その内部を整理するために使う。

ただし `src/components/shell`, `src/components/site-ui`, `src/config`, `src/lib/editorial` は sanctioned exception である。

## 3. Directory Semantics (主要ディレクトリの意味)

迷った時は、次を第一候補として読む。

- `docs/design-docs/*`
  - repo 全体で再利用する rule と原則の正本を置く
  - task 固有の進捗や一時判断は置かない
  - rule 化したい時の第一候補
- `docs/product-specs/*`
  - route や product area 固有の要件を置く
  - 全体 rule や外部ツール手順は置かない
  - route / feature の期待値に迷った時の第一候補
- `docs/exec-plans/active/*`
  - この repo の `PLANS.md` / ExecPlan に相当する作業 artifact を置く
  - backlog と進行中 task の source of truth を常に更新して次セッションへ引き継ぐ
  - 共通 rule や完了済み履歴は置かない
- `docs/exec-plans/completed/*`
  - 完了した task の pure work log を置く
  - 新規委譲用の contract や reusable rule の正本は置かない
  - 過去の実装判断を辿りたい時の第一候補
- `docs/workflows/*`
  - 繰り返し使う運用手順を置く
  - task 本体や外部製品の参考資料は置かない
  - 「どう進めるか」に迷った時の第一候補
- `docs/references/*`
  - 外部ツールや外部環境との接続手順だけを置く
  - repo 内の ownership rule や task plan は置かない
  - 外部連携の確認が必要な時の第一候補
- `src/app/*`
  - route entry と route-private world を置く
  - cross-route shared feature は置かない
  - 1 route で閉じる実装の第一候補
- `src/features/*`
  - 複数 route で再利用される domain feature を置く
  - site shell や vendor primitive は置かない
  - route をまたいで再利用が実在した時の第一候補
- `src/components/shell`
  - site shell そのものを置く
  - domain workflow や route content は置かない
- `src/components/site-ui`
  - site 全体で共有する presentation component を置く
  - domain knowledge を持つ UI は置かない
- `src/components/ui`
  - shadcn primitives を置く
  - app 固有の意味や workflow rule は持たせない
- `src/lib`
  - cross-route の pure shared logic を置く
  - feature owner が明確な code は置かない
- `src/config`
  - env parse、policy、limit、site-wide config を置く
  - feature-local constant や route-local option は置かない
- `src/content`
  - authored content を置く
  - runtime helper や identifiers data は置かない
