---
name: harness-known-gaps
description: Known gaps and deferred decisions in the repo's harness. Read when reviewing the harness, extending it, or working near boundaries that are intentionally not fully specified yet.
user-invocable: false
---

# Known Gaps

この文書は、`docs/harness` がまだ完全には規定していない論点を管理する。
「未定義」を隠さず、README から辿れる durable memory として残すためにある。

## When to Read

次のときはこの文書も読む。

- harness 自体を review する
- routing を読んでも第一候補が決まらない
- repo に新しい runtime boundary を持ち込む
- shared 化の例外や sanctioned exception を増やしたい
- 「今回は保留」が本当に妥当か確認したい

## Current Gaps

### Runtime boundaries beyond page/layout

- `proxy.ts`
  - Next.js の framework runtime entry として扱う
  - feature owner そのものではない
  - locale / rewrite / request gate のような request-front-door に限る
- `route.ts`
  - App Router でも、non-UI HTTP endpoint が必要なときだけ使う
  - webhook、feed、signed callback、redirect endpoint などが典型
  - 必要がない限り先に受け皿を作らない
- `server action`
  - user-originated mutation が本当に必要になった時点で定義する
  - form submit、settings update、small admin action が候補
  - まだ repo の常設 runtime としては規定しない
- `webhook`
  - external service からの受信口が必要になったら検討する
  - payment、CMS、GitHub、form SaaS などが典型
- `cron`, `worker`, `queue`, `DB migration`
  - 現時点では保留する
  - scheduled work、background processing、database 導入が起きたときだけ owner を決める

### Feature granularity

- page feature
- business capability
- workflow unit

横断機能では、この 3 つの切り分けがまだ揉めやすい。

### Shared feature vs shell vs site-ui

- search modal
- command palette
- notification center
- globally mounted provider-backed UI

これらは mount point と owner を分けて考える必要があるが、
具体パターンはまだ増やす余地がある。

### Promote-later exceptions

`local-first, promote-later` は基本原則だが、
次のような「reuse 前でも single source of truth が勝つ」対象は
例外を追加整理する余地がある。

- contract / schema
- env parse
- site policy
- public route registry
- permission / role / limit
- freshness policy

## Deferred By Default

この repo では、必要条件が現れるまでは次を常設しない。

- `route.ts`
- `server action`
- `webhook`
- `cron`
- `worker`
- `queue`
- `DB migration`

「使うかもしれない」だけでは owner を増やさない。
必要条件が実在した時点で、第一候補の置き場と guard を定義する。

## Update Trigger

次のどちらかが起きたら、この文書だけで済ませず
`README` または `references/*.md` へ rule を昇格する。

- 同じ gap に 2 回以上ぶつかった
- gap を埋める判断が reusable rule として書ける
