---
name: static-editorial-updates
description: 管理者の編集を反映しつつeditorialページを静的に保つためのケース記録。
summary: 保存時にページのレンダリングを動的にするのではなく、影響を受けるパスを明示的に再検証（revalidate）すれば、公開されているeditorialルートは静的/ISRを保つことができる。
read_when:
  - 公開されているeditorialコレクションの取得またはレンダリング方法を変更する時
  - editorial adminフォーム内の保存/公開フローを設計する時
skip_when:
  - 管理者自身のような、純粋に個人的で最適化されていないルートをレンダリングする時
user-invocable: false
---

# Static Editorial Updates

## Goal

public route の `dynamic = 'force-static'` を維持しつつ、
admin からの record 更新を反映したい。

## Current strategy

- public page は `*.assemble.ts` で source override を読む
- page 自体は static / ISR のままにする
- admin 保存後に `revalidatePath` で affected page を無効化する

この形なら、request ごとに page を dynamic にせず、
更新時だけ regenerate できる。

## Why this is acceptable

`force-static` は「毎 request で cookie や header に依存しない」方針として維持できる。
editorial update は admin action から明示的に path revalidation する。

## Open edge cases

- dynamic segment を持つ page は path pattern の revalidation 設計が必要
- `links/[shortUrl]` は新規 short url 追加に対応するため、`dynamicParams=false` を外した
- route 数が増えたら tag-based revalidation の方が保守しやすい可能性がある

## Sources

- https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
- https://nextjs.org/docs/app/building-your-application/data-fetching/caching

