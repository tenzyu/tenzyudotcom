# Approved retirement unit

This unit implements the user's complete-retirement approval on `renewal/retire-approved`, based on `7753bf43`.
It removes the assigned product code and obsolete tooling. Editor and navigation integration belongs to separate renewal units.

## Backup evidence

The pre-retirement restore report is `../tenzyudotcom-renewal-safety-20261101/restore-report.json`.
It reports `contentsMatch: true` and an empty `unexpected` list. File metadata is not identical.
The backup archive SHA-256 is `a3d62c82f22151acd3782a3d789798fd36f3d6bf9d465e7079e1f731b9dcf3c2`.

## Scope

The unit deletes 761 tracked files, grouped by their owning directory.

| Group | Deleted files |
| --- | ---: |
| `.atelier-bootstrap` | 169 |
| `.opencode` Atelier agents and skills | 9 |
| Obsolete `harness` material | 303 |
| `product/apps/atelier` | 207 |
| `product/apps/castalia` | 22 |
| Retired Web routes and recommendations feature | 46 |
| Root launcher, manifest, release workflow, and harness compiler pair | 5 |

The deleted Web directories are under `product/apps/web/src`.

- `app/[locale]/(main)/pointers`
- `app/[locale]/(main)/puzzles`
- `app/[locale]/(main)/recommendations`
- `features/recommendations`

The five other deletions are `atelier.ts`, `MANIFEST.json`, `.github/workflows/release-atelier.yml`, and `repo-ops/scripts/compile-agents-md.ts` with its test.

The retained `harness` contains eight historical ADRs, two useful audit reports, and an explanatory README. Its README marks all records as historical rather than active instructions.

Root integration changes are limited to these files.

- `AGENTS.md` replaces the old Atelier goal with concise workspace instructions.
- `README.md` documents the remaining projects and commands.
- `package.json` removes Atelier commands, the docs-map compiler command, the goal plugin dependency, and the unused direct MCP SDK catalog entry.
- `bun.lock` removes the retired workspace and goal plugin entries. Its diff has zero added lines and 21 removed lines.
- `opencode.json` removes the Atelier MCP server, goal command, goal plugin, and obsolete watcher exclusions.
- `.codex/config.toml` removes the Atelier MCP server and the goal feature setting.
- `.gitignore` removes retired launcher, state, and goal-plugin patterns.
- `flake.nix` removes retired apps, packages, checks, and the launcher wrapper.
- `nix/devshells.nix` makes the default shell use the Web package set.
- `nix/packages.nix` removes the Atelier package and the combined native default package set.
- `nix/shell-hooks.nix` stops sourcing `.env` automatically and uses the existing completion script path.
- `repo-ops/scripts/completion.sh` points the retained general Markdown rename completion at its actual script path.

`nx.json` needs no edit because retired projects were discovered from their own manifests. `.gemini/settings.json` has no retired MCP registration. `flake.lock` retains its existing input pins.
The general docs-rename and notes-threading tools remain because they are not exclusive to the obsolete harness.

## Verification

Commands ran in the retirement worktree with Bun 1.3.13, supplied by the existing Nix pin. The package-manager declaration remains `bun@1.3.10`.

| Command | Result |
| --- | --- |
| `bun install --ignore-scripts --lockfile-only` | Passed. Saved the removal-only lockfile. |
| `bun install --frozen-lockfile --ignore-scripts` | Passed. Checked 1,982 installs across 1,991 packages with no changes. |
| `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_SKIP_NX_CACHE=true bun nx show projects --json` | Passed. Listed six active projects. |
| `NX_DAEMON=false NX_ISOLATE_PLUGINS=false bun nx show project web --json` | Passed. Resolved the Web targets and dependencies. |
| `bun run policy:deps` | Passed. |
| `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_SKIP_NX_CACHE=true bun run verify:workspace` | Passed. Dependency policy and `linter:lint-rules` passed. |
| `bun run test:scripts` | Passed. 11 tests, zero failures, 42 expectations. |
| `nix eval --no-write-lock-file --json .#devShells.x86_64-linux.default.nativeBuildInputs --apply 'packages: map (p: p.name) packages'` | Passed. Bun, Node.js 22, and Biome only. |
| `nix eval --no-write-lock-file --json .#devShells.x86_64-linux.skin-workbench.nativeBuildInputs --apply 'packages: map (p: p.name) packages'` | Passed. Retains the optional Rust and Tauri dependencies. No Rust command ran. |
| `nix eval --no-write-lock-file --json .#devShells.x86_64-linux --apply builtins.attrNames` | Passed. Lists default, minimal, repo-ops, skin-workbench, and web. |
| `nix develop --no-write-lock-file .#default --command bash --noprofile --norc -c 'bun --version && node --version && biome --version'` | Passed. Reports 1.3.13, v22.22.3, and Biome 2.4.16. |
| `git diff --numstat -- bun.lock` | `0 21 bun.lock`. No dependency upgrades. |
| `git diff --check` | Passed. |

The first dependency install timed out. A later frozen install completed successfully. The first Nx attempt failed because installation had not yet linked Nx. The final project listing and workspace verification both passed.

The active Nx projects are `@tenzyu/chatgpt-partial-html-export`, `skin-workbench`, `osu-skin-core`, `linter`, `ui`, and `web`.

Git inventory checks found no remaining tracked files in the retired product or bootstrap directories. Inline Node assertions confirmed that the retired root scripts, plugin dependency, OpenCode goal command, and Atelier MCP registration are absent.
Protected-path diff checks found no changes to the editor, navigation, home, shell, archives, osu, UI, workbench, skin-core, or renewal observation tooling. Serena activation automatically rewrote its project configuration. That tooling-only rewrite was restored exactly before staging.

No full Web build or typecheck is claimed. The remaining editor imports below must be removed by the editor unit before integration can compile.

## Reference handoff

The editor worker must remove imports of the deleted domains and infrastructure from these locations.

- `product/apps/web/src/features/content-editor/editor-collections.ts` imports the pointers, puzzles, and recommendations types and registers their collections.
- `product/apps/web/src/app/[locale]/(admin)/editor/_features/editor.assemble.ts` imports all three retired public route infrastructure modules.
- In that same editor directory, `pointers-editor.tsx`, `pointers-editor-client.tsx`, and `pointers-editor-deferred.tsx` reference the removed pointers domain.
- `puzzles-editor.tsx`, `puzzles-editor-client.tsx`, and `puzzles-editor-deferred.tsx` reference the removed puzzles domain.
- `recommendations-editor.tsx`, `recommendations-editor-client.tsx`, and `recommendations-editor-deferred.tsx` reference the removed recommendations feature.
- `editor.tsx`, `editor-input.assemble.ts`, and `admin-editor.content.ts` still include the retired collection UI, validation, and copy. Shared labels in `links-editor.tsx` and `notes-editor.tsx` use `recommendationsEditor` keys.

The navigation and Web configuration worker must remove route IDs, links, copy, and allowances from these locations.

- `product/apps/web/src/features/site-navigation/public-routes.data.ts`
- `product/apps/web/src/config/site-policy.ts`
- `product/apps/web/src/app/[locale]/_features/shell/breadcrumb-nav.content.ts`
- `product/apps/web/src/app/[locale]/(main)/(home)/_features/navigation-tiles.tsx`
- `product/apps/web/src/app/[locale]/(main)/(home)/_features/navigation-tiles.content.ts`
- `product/apps/web/src/app/[locale]/(main)/(home)/page.content.ts`
- `product/apps/web/vsa.config.json`

Other repository maintenance references remain outside this unit's ownership.

- `product/packages/linter/src/rules` contains obsolete harness documentation pointers, document-rules paths and fixtures, and retired route ownership examples. These need a scoped linter follow-up that retains validation behavior.
- `.vscode/extensions.json` contains a retired-product reference.
- `.serena/memories/project_overview.md` still describes the previous repository layout.
- The general docs-rename test uses a harness path as a synthetic rename destination. It does not require the old harness to exist.
- The browser extension's README and options page link to old harness instructions.
- Existing `docs/renewal` and `repo-ops/renewal` baseline records retain pre-approval historical descriptions. This report records the approved retirement without rewriting that baseline evidence.

To refresh the handoff, run a filename-only search for `atelier|castalia|pointers|puzzles|recommendations|harness/` and exclude dependency directories and historical renewal records.

## Review record

The workflow was inventory, deletion, root integration updates, runtime checks, and an explicit-scope commit. The verified backup and strict ownership boundaries make deletion reversible and reviewable. Laziness Protocol led to deletion without compatibility wrappers. Prove It Works led to actual Nx discovery, shell startup, policy execution, and retained script tests.

The decision trail is `docs/renewal/retirement-unit.tsv`. OpenCode exposes no subagent tool or selectable models in this session. No independent review is claimed. Deslop was read before the final diff inspection and commit.
