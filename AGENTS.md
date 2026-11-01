# Repository instructions

- Use Bun workspaces and Nx. Inspect `package.json`, `nx.json`, and `bun nx show project <name> --json` before choosing commands.
- Put apps in `product/apps`, shared packages in `product/packages`, and repository tooling in `repo-ops`.
- Apps may import packages. Packages must not import apps, and product runtime code must not import `repo-ops`.
- Keep authored content, secrets, and unrelated work intact. Do not read `.env` files or write to the external content repository without an explicit request.
- Keep `@tenzyu/osu-skin-core` runtime-pure. Keep app-specific behavior out of `@tenzyu/ui`.
- Atelier, Castalia, pointers, puzzles, recommendations, and the old agent harness are retired. Historical ADRs and reports under `harness` are reference material, not active instructions.
- Renewal decisions and evidence live in `docs/renewal`. Observation tools live in `repo-ops/renewal`.
- Make scoped changes, run the relevant commands, and report actual results and remaining issues. Commit or push only when requested.
