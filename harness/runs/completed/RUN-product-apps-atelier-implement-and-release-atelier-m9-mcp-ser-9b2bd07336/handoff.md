# Handoff

## What landed

- **M9 MCP server** — `atelier mcp` exposes 12 tools over stdio. Same core as CLI; mutations gated by `confirm: true` or `--allow-mutations`.
- **M10 GUI** — `atelier gui` serves a no-build static UI on 127.0.0.1 with 5 screens and a JSON API.
- **Repo owner resolver** — `atelier repo owner <path>` and `atelier_repo_owner` MCP tool resolve a path to its Nx project and harness role (via `selectors.paths`).
- **`atelier run status`** — CLI subcommand + MCP `atelier_run_status` tool.
- **MCP registration** — `.agent/mcp.json` now starts the `atelier` server automatically.

## Files added

- `product/apps/atelier/src/core/mcp.ts`
- `product/apps/atelier/src/core/gui.ts`
- `product/apps/atelier/src/core/gui-server.ts`
- `product/apps/atelier/src/core/owner.ts`
- `product/apps/atelier/src/gui/{index.html,app.js,styles.css}`
- `product/apps/atelier/src/__tests__/{mcp,gui,owner}.test.ts`

## Files modified

- `package.json` — catalog: `@modelcontextprotocol/sdk: 1.29.0`
- `product/apps/atelier/package.json` — added `@modelcontextprotocol/sdk`, `zod` deps
- `product/apps/atelier/project.json` — registered `mcp`, `gui`, `run-status`, `repo-owner` Nx targets
- `product/apps/atelier/src/index.ts` — export new core modules
- `product/apps/atelier/src/cli.ts` — added `mcp`, `gui`, `run status`, `repo owner` commands
- `product/apps/atelier/src/core/runs.ts` — `runStatus()` + `intent` on `RunManifest`
- `product/apps/atelier/src/core/knowledge.ts` — `listKnowledgeProposals()`
- `harness/knowledge/product-specs/atelier/ROADMAP.md` — M9/M10 status: shipped
- `opencode.json` — registered `atelier` MCP server for opencode sessions
- `.agent/mcp.json` — also registered for backwards compatibility

## How to use

### MCP (preferred for agents)

`opencode.json` at the project root registers the `atelier` MCP server, so any opencode session in this repo can call:

- `atelier_doctor`, `atelier_index`, `atelier_context_plan`
- `atelier_run_init` / `atelier_run_status` / `atelier_run_close`
- `atelier_knowledge_propose` / `atelier_knowledge_promote` / `atelier_knowledge_reject`
- `atelier_id_rename`, `atelier_repo_owner`, `atelier_generate`

```json
{
  "name": "atelier_run_init",
  "arguments": {
    "workflowId": "workflow.isolated-run",
    "roleIds": ["role.domain.harness-engineer"],
    "inputPath": "product/apps/atelier",
    "intent": "fix bug",
    "confirm": true
  }
}
```

### Nx targets

```bash
bun nx run atelier:mcp            # start MCP stdio server
bun nx run atelier:gui            # start local GUI (127.0.0.1)
bun nx run atelier:doctor         # run doctor
bun nx run atelier:index          # rebuild generated indexes
bun nx run atelier:context-plan  # build a context plan
bun nx run atelier:run-init       # initialize a run
bun nx run atelier:run-status -- RUN-...   # inspect a run
bun nx run atelier:run-close -- RUN-...    # close a run
bun nx run atelier:repo-owner -- --path <p> # resolve path owner
bun nx run atelier:knowledge      # knowledge inbox commands
bun nx run atelier:id-rename      # symbolic id rename
bun nx run atelier:generate       # refresh generated skills/adapters
bun nx run atelier:test           # 47 tests
bun nx run atelier:typecheck      # tsc --noEmit
bun nx run atelier:check          # typecheck + test
```

### GUI

```bash
bun nx run atelier:gui
# open http://127.0.0.1:4173
```

### Direct CLI

```bash
bun product/apps/atelier/src/cli.ts repo owner --path product/apps/atelier
bun product/apps/atelier/src/cli.ts run status RUN-...
```

## Release notes

None — user instructed to skip version bump, CHANGELOG, git tag, and release commit for this milestone. Roadmap updated to reflect `shipped` status inline.

## Follow-ups (out of scope)

- Add the GUI to a release manifest / storybook.
- Implement M11 (repo-map + path-ownership generation) which would replace the role `selectors.paths` heuristic.
- Resolve the 5 pre-existing `BROKEN_MARKDOWN_LINK` diagnostics in `harness/knowledge/rules/compiled/AGENTS.md`.
