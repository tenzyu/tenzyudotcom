This is a Next.js App Router project managed with Nix + Bun.

## Harness

現時点で大事なのは、OpenAI の言う “harness engineering” は「プロンプト上手」じゃなくて、「リポジトリを agent が読める運用OSにする」話だってこと。そこを外すとただの雰囲気導入で終わる。

## Commands

```bash
bun run dev:overlay   # react-grab overlay を明示的に使うとき
bun run lint
bun run lint:fix
bun run test:contracts
bun run verify        # lint + contracts + build
bun run analyze
```

通常の開発では `bun run dev` を使い、overlay は `bun run dev:overlay` で明示的に opt-in します。

## Notes

- `nix develop -c bun run verify` が repo の標準 verification です。
- `docs/` は current code ではなく target architecture を定義します。
