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
