This is a Next.js App Router project managed with Nix + Bun.

## Harness

AI エージェント運用のための設計文書は [docs/harness/README.md](./docs/harness/README.md) にまとめています。

## Development

```bash
nix develop
bun run dev
```

補助コマンド:

```bash
bun run dev:overlay   # react-grab overlay を明示的に使うとき
bun run lint
bun run lint:fix
bun run test:contracts
bun run typecheck
bun run verify        # lint + typecheck + contracts + build
bun run analyze
```

通常の開発では `bun run dev` を使い、remote overlay は `bun run dev:overlay` で明示的に opt-in します。

## Notes

- `nix develop -c bun run verify` が repo の標準 verification 入口です。
- `typecheck` は app code を対象にし、test file の検証は `bun run test:contracts` が担当します。
- `docs/harness` は current code ではなく target architecture を定義します。

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
