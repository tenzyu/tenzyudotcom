# Repository instructions

- Use Bun workspaces and Nx. Inspect `package.json`, `nx.json`, and `bun nx show project <name> --json` before choosing commands.
- On neko7, run project commands through `nix develop --no-write-lock-file --command`. Use an isolated copy without dotenv files when a tool may load them.
- Search for relevant paths and symbols before reading files. Read focused sections, then expand when needed to understand behavior and dependencies.
- Keep command output focused without hiding exit codes or failure details. Preserve full logs outside Git when needed, and inspect the relevant failures.
- Start verification with the affected project and behavior, then expand to dependent projects or broader checks when the change requires them. Report checks not run.
- Avoid extra model calls, parallel agents, and repeated investigation unless they help resolve the task. Preserve decisions, evidence, and next steps when handing work to a new session.
- Put apps in `product/apps`, shared packages in `product/packages`, and repository tooling in `repo-ops`.
- Apps may import packages. Packages must not import apps, and product runtime code must not import `repo-ops`.
- Keep authored content, secrets, and unrelated work intact. Do not read `.env` files or write to the external content repository without an explicit request.
- Keep `@tenzyu/osu-skin-core` runtime-pure. Keep app-specific behavior out of `@tenzyu/ui`.
- Atelier, Castalia, pointers, puzzles, recommendations, and the old agent harness are retired. Historical ADRs and reports under `harness` are reference material, not active instructions.
- Renewal decisions and evidence live in `docs/renewal`. Observation tools live in `repo-ops/renewal`.
- Make scoped changes, run the relevant commands, and report actual results and remaining issues. Commit or push only when requested.
