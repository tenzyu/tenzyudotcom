# Vercel Editorial Storage

## Recommendation

現時点では、self-hosted server を持たず Vercel に載せる前提なら、
editorial record の永続化先は private Vercel Blob が第一候補。

理由:

- JSON record をそのまま保存しやすい
- self-only admin との相性がよい
- `source` を外部化しても route 側の assemble を大きく変えずに済む
- object storage なので、1 record set = 1 blob の運用が自然

## Why not KV first

KV 的な key-value store は小さい設定値には向くが、
この repo が持つのは curated record set であり、
配列全体の validate / replace / migrate をしたい。
そのため JSON blob の方が自然。

## Why not Edge Config first

Edge Config は reads-heavy な config 配布には強いが、
record editor の primary store としては窮屈。

- config 配布向きで、record set の置換や schema migration を主目的にしていない
- self-only admin から JSON source を丸ごと保存する用途には object storage の方が自然
- feature flag や small routing rule の配布先としては候補になる

## When Postgres is better

次のどれかが起きたら Postgres / Neon 系を検討する。

- 多人数編集
- audit log が必要
- record 単位の検索や絞り込みが増える
- relation を張りたい
- publish / draft / schedule の state が複雑になる

## Current local fallback

local development では `storage/editorial/*.json` を使う。
存在しないときは `*.source.ts` にフォールバックする。

## Sources

- https://vercel.com/docs/vercel-blob
- https://vercel.com/docs/vercel-blob/private-storage
- https://vercel.com/docs/storage
