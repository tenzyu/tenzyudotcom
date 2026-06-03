# Atelier

Atelier is the local control plane for the repository harness.

Atelier is CLI-first and file-backed. It reads Markdown under `harness/`, reports
source-contract diagnostics, compiles generated indexes, plans and renders role-routed
context, initializes active run folders, closes runs through an evidence gate,
and promotes durable knowledge only from explicit proposals.

`context.md` is the first file an agent should read for a run. It is a compiled
context pack, not just a list of links and not a raw copy of every selected
source document. `context.manifest.json` stores provenance, hashes, selection
reasons, and expansion records.

## Usage

Inside the root dev shell, use `atelier` directly:

```bash
atelier doctor
atelier doctor --json
atelier index
atelier index --check
atelier context plan --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
atelier context render --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
atelier run init --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth" --mode compact
atelier context expand RUN-ID knowledge.rule.security.example
atelier run status RUN-ID
atelier run close RUN-ID
atelier repo owner --path product/apps/atelier/src/cli.ts
atelier repo map
atelier knowledge propose --from-run RUN-ID --kind rule --title "..."
atelier knowledge promote harness/runs/active/RUN-ID/knowledge-proposals/example.md
atelier knowledge reject harness/runs/active/RUN-ID/knowledge-proposals/example.md --reason "..."
atelier id rename knowledge.rule.example knowledge.rule.example-v2
atelier id rename knowledge.rule.example knowledge.rule.example-v2 --write
atelier generate --write
atelier mcp
atelier gui
```

Outside the dev shell, route through the root flake:

```bash
nix run .#atelier -- doctor
nix run .#atelier -- run init --workflow workflow.isolated-run --role role.domain.web-app-engineer --path product/apps/web --intent "fix server action auth"
```

Development checks can run from the package directory:

```bash
cd product/apps/atelier
bun run typecheck
bun run test
```

## Nix Distribution Modes

Atelier has three separate Nix-facing paths:

1. External consumers use `product/apps/atelier` as the lightweight subflake.
   Its default package is the fixed-output release binary from
   `nix/package.nix`. This path must not run `bun install` in the consumer's
   Nix sandbox.
2. Monorepo dogfooding uses the root flake app/dev-shell runner. In this repo,
   `nix run .#atelier -- <args>`, `nix build .#atelier`, and `nix develop`
   route `atelier` to the current checkout's `product/apps/atelier/src/cli.ts`,
   so development can use the latest source before a release asset exists.
3. Source-build packaging should stay separate from the default release
   package. If we adopt `bun2nix`, use it for an explicit source-build package
   after generating and committing the matching `bun.nix`; do not replace the
   external default until `bun build --compile` reproducibility has been proven.

Release packages are published from `.github/workflows/release-atelier.yml` via
`workflow_dispatch`. Set `update_package_nix=true` and `publish_release=true`
with a tag matching the package version, such as `atelier-v0.1.0`. The workflow
builds the four platform archives, computes their Nix SRI hashes, commits the
`nix/package.nix` hash update, tags that commit, and uploads the same archive
bytes to GitHub Releases.

The workflow writes compiled binaries under `product/apps/atelier/release/`.
That directory is ignored and only used as local or CI staging; release archives
still contain a top-level `atelier` executable so `nix/package.nix` can install
it directly.

## Current Scope

- Parse Markdown frontmatter with `Bun.YAML`.
- Classify harness documents by progressive strictness.
- Report missing IDs, invalid frontmatter, unknown kinds, duplicate IDs, broken
  Markdown links, stale `harness/ai-org` references, and missing phase references.
- Compile stable generated indexes under `.harness/generated`.
- Plan context selection from workflow, role, input path, intent, and context mode.
- Render compiled context packs and initialize run folders with `brief.md`, `context.md`, and
  provenance-only `context.manifest.json`.
- Support context modes:
  - `compact`: default, embeds compiled excerpts of required context.
  - `full`: embeds larger required source bodies when practical.
  - `linked`: keeps output link-centered for low-cost plan review or human checks.
- Expand active run context with manifest, context, and worklog records.
- Close non-trivial runs only after required artifacts, context hashes,
  verification, handoff, review, and proposal state pass the completion gate.
- Create, promote, and reject knowledge proposals without automatically turning
  raw run logs into durable knowledge.
- Rename symbolic ids across frontmatter, body references, and generated indexes
  with a preview-first safety model.
- Refresh generated skills and root adapters from the current harness.
- Serve the local GUI with read-only views and guarded mutations.
- Expose the MCP server with read-only tools by default and explicit mutation
  confirmation.

## Non-Goals

- automatic fixes
- automatic knowledge promotion
