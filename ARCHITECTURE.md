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
