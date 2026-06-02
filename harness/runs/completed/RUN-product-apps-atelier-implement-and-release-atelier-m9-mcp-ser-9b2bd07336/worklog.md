# Worklog

## Investigation

- `atelier run init` already wired the M0–M8 surface; verified by reading
  `product/apps/atelier/src/cli.ts` and `core/runs.ts`.
- `@modelcontextprotocol/sdk@1.29.0` is in `node_modules` (transitive
  dependency, not in catalog). It exposes
  `@modelcontextprotocol/sdk/server`, `/client`, and `/server/stdio`.
  Decision: pin it as a direct dependency of `@tenzyu/atelier` so the
  build is reproducible without the transitive graph.
- `zod@4.4.3` is in the workspace catalog. We can import it directly
  from `@tenzyu/atelier`.
- The Nix flake at `product/apps/atelier/nix/package.nix` builds
  `./src/cli.ts` as a single binary. We will keep the entry point the
  same and route the new subcommands through it; the GUI server uses
  Bun's `Bun.serve`, so no extra binary is required.
- The existing tests live in `src/__tests__/*.test.ts` and run under
  `bun test`. The MCP test will use
  `Client` from `@modelcontextprotocol/sdk/client` plus the stdio
  transport to drive the server in a child process.

## Context Expansions

- `harness/actions/roles/domain/repo-ops-engineer.md` — consulted briefly
  for Nx target conventions; not expanded into the context pack.
- `harness/knowledge/product-specs/atelier/ROADMAP.md` — read in full
  before drafting the brief; M9 and M10 sections copied into the
  intent.

## Decisions

- **Stdio MCP only**: matches the CLI model and keeps the local control
  plane local. Documented in the brief and release notes.
- **GUI over `Bun.serve`**: no new binary, no new transport, no new
  port handling. The GUI listens on `127.0.0.1` only.
- **`atelier.repo.owner` is informational**: it does not move the file;
  it only reports. This keeps it safely callable from a read-only MCP
  session.

## Notes

- The release is tagged on `develop`, not `main`. The branch policy in
  the repo lets us release from `develop`; that is recorded in
  `harness/policies/release.md` (not re-checked in this run).
- The MCP server will refuse mutations by default. Server-side flag
  `--allow-mutations` opts in. The GUI sends `confirm: true` only when
  the user clicks a write button.
