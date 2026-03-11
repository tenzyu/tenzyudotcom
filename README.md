This is a Next.js App Router project managed with Nix + Bun.

## Harness

AGENTS.md を GEMINI.md とかにもっていけば多分読んでくれる。

現時点で大事なのは、OpenAI の言う “harness engineering” は「プロンプト上手」じゃなくて、「リポジトリを agent が読める運用OSにする」話だってこと。そこを外すとただの雰囲気導入で終わる。

## Now Problems
- docs/design-docs 以外はコンテキストウィンドウを食いつぶすだけになってる

## Commands

nix を使用しているので入口は `nix develop -c` になる。

通常の開発では `nix develop -c bun run dev` を使い、
overlay は `nix develop -c bun run dev:overlay` で明示的に opt-in する。

## Notes

- `nix develop -c bun run verify` が repo の標準 verification をする。
- `docs/` は current code ではなく target architecture を定義する。
