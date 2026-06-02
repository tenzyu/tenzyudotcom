# Plan: M9 + M10 release

## Sequencing

1. **Worklog** — record investigation findings before implementation.
2. **MCP server** — `product/apps/atelier/src/core/mcp.ts` plus
   `src/core/mcp-tools.ts`. Same core calls as CLI. Stdio transport only.
3. **MCP tests** — `src/__tests__/mcp.test.ts` using
   `@modelcontextprotocol/sdk/client/stdio` to validate
   `tools/list` and one tool per category.
4. **GUI HTTP layer** — `product/apps/atelier/src/core/gui.ts`. JSON
   endpoints that proxy into the same core functions; default
   read-only with explicit `confirm: true` for mutations.
5. **GUI static assets** — `product/apps/atelier/src/gui/index.html`,
   `app.js`, `styles.css`. Five screens: Doctor, Role Bundle Preview,
   Context Plan, Knowledge Inbox, ID Rename.
6. **Repo owner query** — `product/apps/atelier/src/core/owner.ts` so
   both MCP and GUI can answer `atelier.repo.owner`.
7. **CLI wiring** — extend `src/cli.ts` with `mcp` and `gui` commands.
   `usage()` updated.
8. **Nx targets** — extend `project.json` with `mcp` and `gui` smoke
   targets.
9. **Nix packaging** — extend `nix/package.nix` to build the CLI plus
   GUI assets. Update `flake.nix` to expose `mcp` and `gui` apps.
10. **Knowledge + roadmap** — mark M9 and M10 shipped in
    `harness/knowledge/product-specs/atelier/ROADMAP.md`; add
    `harness/knowledge/product-specs/atelier/RELEASE-0.2.0.md`.
11. **Regenerate** — run `atelier generate --write` to update
    `.harness/generated/skills/atelier.md` and the root adapters.
12. **Verification** — typecheck, test, build, doctor, index-check,
    policy:deps, smoke MCP, smoke GUI.
13. **Release** — `CHANGELOG.md` entry, `git commit`, `git tag
    atelier-v0.2.0`.
14. **Close run** — write `verification.md` and `handoff.md`; run
    `atelier run close <RUN-ID>`.

## Key Decisions

- **MCP transport**: stdio only. We avoid HTTP transport because Atelier
  is a local control plane and stdio matches the CLI execution model.
- **Mutation safety**: the MCP server and GUI both require an explicit
  `confirm: true` flag for writes. The CLI gets a `--allow-mutations`
  flag that opts the running server into write mode. The default is
  read-only/preview, matching the M9 acceptance criteria.
- **GUI stack**: vanilla HTML/JS/CSS. No build step. The Bun HTTP server
  serves the files from `src/gui/`. This keeps the GUI diff small,
  auditable, and dependency-free.
- **Repo owner**: look up `project.json` Nx projects first, fall back to
  `selectors.paths` declared on `kind: role` documents. Returns
  `{ project, ownerRole, rolePath, source }`.
- **Generated content**: do not hand-edit the generated adapters or
  `skill.atelier`; regenerate them with `atelier generate --write`.

## Files Touched

```
product/apps/atelier/src/core/mcp.ts                 (new)
product/apps/atelier/src/core/mcp-tools.ts           (new)
product/apps/atelier/src/core/gui.ts                 (new)
product/apps/atelier/src/core/owner.ts               (new)
product/apps/atelier/src/gui/index.html              (new)
product/apps/atelier/src/gui/app.js                  (new)
product/apps/atelier/src/gui/styles.css              (new)
product/apps/atelier/src/index.ts                    (extend exports)
product/apps/atelier/src/cli.ts                      (add mcp + gui)
product/apps/atelier/project.json                    (add targets)
product/apps/atelier/nix/package.nix                 (build gui assets)
product/apps/atelier/flake.nix                       (mcp + gui apps)
product/apps/atelier/src/__tests__/mcp.test.ts       (new)
product/apps/atelier/src/__tests__/gui.test.ts       (new)
product/apps/atelier/src/__tests__/owner.test.ts     (new)
harness/knowledge/product-specs/atelier/ROADMAP.md   (M9/M10 ship status)
harness/knowledge/product-specs/atelier/README.md    (link release notes)
harness/knowledge/product-specs/atelier/RELEASE-0.2.0.md  (new)
.harness/generated/skills/atelier.md                 (regen)
harness/adapters/root/{AGENTS,CLAUDE,GEMINI}.md      (regen)
CHANGELOG.md                                         (new, if missing)
harness/runs/active/<RUN-ID>/                        (this run)
```

## Tests to Add

- `mcp.test.ts` — boot the server in-process via `StdioServerTransport`,
  connect with the SDK client, call `tools/list` and one tool per
  category. Assert the response matches the CLI.
- `gui.test.ts` — start the GUI server on an ephemeral port, hit
  `/api/doctor`, `/api/role-bundles`, `/api/knowledge`, `/api/repo-owner`,
  and verify JSON shape.
- `owner.test.ts` — verify `repoOwner` resolves Nx projects, falls back
  to role selectors, and returns `unknown` for paths it cannot map.

## Verification Plan

- `bun nx run atelier:check` (typecheck + test).
- `bun nx run atelier:build` (Bun compile).
- `bun nx run atelier:doctor -- --json` (clean).
- `bun nx run atelier:index-check` (clean).
- `bun run policy:deps` (clean).
- Manual: `atelier --help`, `atelier mcp --help`, `atelier gui --help`.
- Manual: pipe `atelier mcp` to a JSON-RPC probe, expect a `tools/list`
  response with eleven entries.
- Manual: `atelier gui --port 0`, curl `/api/doctor`, expect the same
  report as `atelier doctor --json`.

## Release Plan

- Bump `product/apps/atelier/package.json` to `0.2.0`.
- Bump `product/apps/atelier/nix/package.nix` `version` to `0.2.0`.
- Add `harness/knowledge/product-specs/atelier/RELEASE-0.2.0.md` with
  release notes (new in M9, new in M10, upgrade instructions, breaking
  changes: none).
- Commit as `feat(atelier): implement M9 MCP server and M10 GUI, release v0.2.0`.
- Tag `atelier-v0.2.0` on the release commit.
- Push the branch (per request, after `atelier run close` succeeds).
