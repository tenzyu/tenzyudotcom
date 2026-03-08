# TODO

## Follow-ups

- `EDITORIAL_STORAGE_DRIVER=blob` を実際に使うために、Vercel project env に
  `EDITORIAL_ADMIN_PASSWORD`, `EDITORIAL_SESSION_SECRET`, `EDITORIAL_STORAGE_DRIVER=blob`,
  `EDITORIAL_BLOB_PREFIX`, `BLOB_READ_WRITE_TOKEN` を入れる
- admin UI は現在 JSON editor 方式
  - collection ごとの専用 form にする余地がある
- path-based revalidation は入っている
  - collection 数や route 数が増えたら tag-based revalidation を検討する
- `typecheck` は Next 16 の typegen だけでは `.next/types/cache-life.d.ts` が揃わないため、
  現在は script 側で stub を touch している
  - Next 側で安定したら外したい
- `links/[shortUrl]` の redirect route は新規 shortUrl に追従できるよう調整済み
  - production で実際に admin 更新後の生成挙動を確認したい
- private route は `/editorial/*` に移し、noindex にしている
  - 必要なら header / middleware レベルの hardening を足す
- session auth は self-only minimal auth
  - passkey / provider / audit log は未対応

## If Blocked Later

- storage 周りで blob token や Vercel env が未設定なら、`local` driver のまま作業継続
- source schema を変えるときは `*.contract.ts` を先に直す
- public route の整合確認は `bun run build` を優先
