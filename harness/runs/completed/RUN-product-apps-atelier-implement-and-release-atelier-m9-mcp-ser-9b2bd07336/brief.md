---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-implement-and-release-atelier-m9-mcp-ser-9b2bd07336.brief
title: "RUN-product-apps-atelier-implement-and-release-atelier-m9-mcp-ser-9b2bd07336 Brief"
status: active
summary: Implement and release Atelier M9 (MCP server) and M10 (GUI).
tags:
  - harness
  - run
  - atelier
  - mcp
  - gui
  - release
---

# Brief: RUN-product-apps-atelier-implement-and-release-atelier-m9-mcp-ser-9b2bd07336

## Intent

Implement Atelier roadmap milestones M9 (MCP server) and M10 (local GUI),
package them in the same Bun + Nx + Nix distribution as M0–M8, and ship the
combined release as `atelier v0.2.0`.

The M0–M8 loop is already working. The next step is to make that loop
reachable from MCP-capable agents (M9) and from a local browser-based GUI
(M10) so a human owner can inspect, approve, and operate the harness without
shelling out for every command.

## Background

- `atelier run init`, `atelier run close`, `atelier knowledge propose/promote`,
  `atelier id rename`, and `atelier generate` are already implemented under
  `product/apps/atelier/src/core/`.
- The Nix flake at `product/apps/atelier/flake.nix` builds a single
  `atelier` binary from `src/cli.ts`. It only packages the CLI today.
- `@modelcontextprotocol/sdk` and `zod` are already in the workspace catalog
  and resolved in `node_modules`, so the MCP server can be added without new
  dependencies.
- The release target is the `develop` branch. No other product app is touched.

## Problem

MCP-capable agents (Claude Desktop, opencode, Codex, Gemini, etc.) cannot call
Atelier today, and humans have no local UI for inspecting doctor results,
previewing role bundles, or approving knowledge proposals. Both gaps force
agents and humans to shell out to `atelier` for every interaction, which makes
the harness harder to operate end-to-end.

## Goal

- Expose every Atelier operation listed in the M9 spec
  (`atelier.doctor`, `atelier.index`, `atelier.context.plan`,
  `atelier.run.init`, `atelier.run.status`, `atelier.run.close`,
  `atelier.knowledge.propose`, `atelier.knowledge.promote`,
  `atelier.id.rename`, `atelier.repo.owner`) over Model Context Protocol,
  sharing the exact same core as the CLI.
- Ship a local `atelier gui` command that starts a Bun-driven HTTP server
  serving a static front-end, with JSON endpoints that call the same core
  functions. Initial screens: Doctor, Role Bundle Preview, Context Plan,
  Knowledge Inbox, ID Rename. Bulk Edit is explicitly out of scope for v0.2.0.
- Refresh the generated `skill.atelier` and root adapters so they advertise
  the new surfaces, mark the roadmap M9 and M10 sections as shipped, and cut
  the release.

## Scope

- Allowed:
  - `product/apps/atelier/**` (MCP server, GUI server, static GUI assets,
    tests, Nx target updates).
  - `harness/knowledge/product-specs/atelier/ROADMAP.md` (mark M9 and M10
    shipped; record v0.2.0 release note).
  - `harness/knowledge/product-specs/atelier/README.md` (link release notes).
  - `.harness/generated/skills/atelier.md`, `harness/adapters/root/*`
    (regenerated outputs).
  - This run folder under `harness/runs/active/<RUN-ID>/`.
- Forbidden:
  - `product/apps/web`, `product/apps/castalia`,
    `product/apps/osu-skin-workbench`, `product/packages/*` (release is
    scoped to Atelier only).
  - Durable harness policy changes (`harness/policies/**`,
    `harness/canon/**` are read-only here).
  - Manual edits to generated adapters or generated skill files.
  - Auto-promotion of new durable knowledge — proposals only.
  - Cargo, Nix package, or shell changes outside `product/apps/atelier`.

## Non-Goals

- A cloud or remote GUI. The GUI is local-only and binds to `127.0.0.1`.
- Authentication, multi-user, persistence, or telemetry. The GUI is a thin
  reader/writer over the same core functions; it has no hidden state.
- Bulk Edit screen for v0.2.0. The roadmap keeps it listed under M10, but
  the initial GUI ships the five screens named in the plan.
- A Tauri or native shell. The GUI is a static HTML/JS app served by Bun.
- Replacing the CLI. The CLI stays the canonical, scriptable surface.
- Any new dependency on an LLM provider or a paid MCP transport.

## Constraints

- The MCP server must use the same core functions as the CLI. No duplicated
  business logic.
- The MCP server must default to read-only / preview behavior. Mutating
  tools (`run.init`, `run.close`, `knowledge.propose`, `knowledge.promote`,
  `id.rename`) must accept a `confirm: true` flag and refuse without it
  unless the operator passes `--allow-mutations` to the server.
- The GUI must default to read-only. Mutating actions must be triggered by
  an explicit UI action and must show a diff or summary before write.
- All new code must be typechecked, tested with Bun's test runner, and pass
  `bun nx run atelier:check`.
- Generated files must be reproducible: `atelier generate` (already wired)
  must reflect the new surfaces in the same commit.

## Role Assignment

- Primary: `role.domain.harness-engineer` (already assigned in `context.md`).
- Supporting: `role.domain.repo-ops-engineer` (Nix packaging and Nx target
  wiring; consulted via `context expand` when editing the flake).
- Reviewer: `role.core.reviewer` (required because the change touches the
  release surface and adds a network listener).

## Worktree Isolation

Not required. This run is sequential and the work is contained inside
`product/apps/atelier/**`, `harness/knowledge/product-specs/atelier/**`,
generated outputs, and the run folder. No parallel agent is required and no
other branch is being modified.

## Validation Commands

```bash
bun nx run atelier:typecheck
bun nx run atelier:test
bun nx run atelier:check
bun nx run atelier:build
bun nx run atelier:verify
bun nx run atelier:index-check
bun nx run atelier:doctor -- --json
bun run policy:deps
```

Manual smoke:

```bash
atelier --help
atelier mcp --help
atelier gui --help
atelier gui --port 0   # random port, then curl http://127.0.0.1:<port>/api/doctor
```

## Acceptance Criteria

- `atelier mcp` starts a stdio MCP server. Listing tools via `tools/list`
  returns the eleven tools listed above.
- Every MCP tool's response matches the equivalent CLI response (modulo
  response shape), verified by an automated test using
  `@modelcontextprotocol/sdk/client`.
- `atelier gui` starts a local HTTP server on `127.0.0.1` and serves the
  five initial screens. `curl http://127.0.0.1:<port>/api/doctor` returns
  the same doctor report as `atelier doctor --json --project-root <root>`.
- `bun nx run atelier:check` passes.
- Roadmap M9 and M10 sections are marked shipped, generated `skill.atelier`
  mentions `atelier mcp` and `atelier gui`, and the root adapters stay
  short and route agents through Atelier.
- A `CHANGELOG.md` (or equivalent release note in
  `harness/knowledge/product-specs/atelier/RELEASE-0.2.0.md`) summarizes
  the release, and a git tag `atelier-v0.2.0` is created on the release
  commit.

## Risks

- **MCP transport fragility**: stdio transport is the simplest, but the
  runtime must never print to stdout (it corrupts the protocol). All
  diagnostics must go to stderr. Mitigation: log only via a stderr
  channel and add a test that asserts the protocol stream is clean.
- **GUI scope creep**: M10's screen list is large. Mitigation: ship
  the five screens named in the plan and defer Bulk Edit to v0.3.0.
- **Nix packaging drift**: the flake currently builds only the CLI.
  Mitigation: extend the flake in the same commit, and run
  `bun nx run atelier:build` so the compiled binary exists locally for
  smoke tests.
- **Generated file drift**: M9 and M10 add new surfaces, so the
  generated skill must be updated in the same commit; otherwise the
  doctor will warn about stale generated content.

## Open Questions

- None blocking. Follow-up: should `atelier.repo.owner` look at Nx
  `project.json` only, or also walk the filesystem? Plan: walk
  `project.json` first, fall back to a `path` field on the role frontmatter
  if present, and surface "unknown" otherwise. Documented in
  `verification.md` once the implementation lands.
