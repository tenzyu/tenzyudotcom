# TASK-0018: Atelier M0/M1 App

## Background

Atelier is specified in `harness/knowledge/product-specs/atelier` as the local control plane for the Markdown-based harness. The owner clarified that the product should live under `product/apps`, not `repo-ops`.

## Problem

The harness currently has no executable app that can parse harness Markdown or report early corruption such as duplicate IDs, missing metadata, broken links, or stale `harness/ai-org` references.

## Goal

Create the first `product/apps/atelier` implementation as a CLI-first Nx application that covers the M0 source contract and a useful subset of M1 doctor diagnostics.

## Scope

Allowed files:

- `product/apps/atelier/**`
- `harness/runs/active/TASK-0018-atelier-m0-m1-app/**`
- root workspace config only if required to register the app

Forbidden files:

- Existing product app behavior outside `product/apps/atelier`
- User-provided Atelier spec files except for reading them
- Destructive git operations

## Non-Goals

- GUI
- MCP server
- vector search
- automatic knowledge promotion
- context preview or run init beyond documenting next steps

## Constraints

- Place the product under `product/apps/atelier`.
- Preserve user/untracked files: `MANIFEST.json` and `harness/knowledge/product-specs/atelier/**`.
- Use Bun and Nx project targets.
- Keep Markdown as the authored source of truth.

## Role Assignment

- Primary role: `harness/actions/roles/domain/repo-ops-engineer.md`
- Supporting roles: `harness/actions/roles/core/implementer.md`
- Reviewer role: implicit self-review for this first app slice
- Governance role: none

## Required Knowledge

- `harness/canon/model.md`
- `harness/adapters/root/AGENTS.md`
- `harness/actions/workflows/isolated-run.md`
- `harness/actions/roles/domain/repo-ops-engineer.md`
- `harness/actions/roles/core/implementer.md`
- `harness/policies/repository.md`
- `harness/policies/tools/git.md`
- `harness/policies/tools/nx.md`
- `harness/knowledge/repo-map.md`
- `harness/knowledge/monorepo/nx.md`
- `harness/knowledge/product-specs/atelier/README.md`
- `harness/knowledge/product-specs/atelier/ROADMAP.md`

## Validation

- `bun nx show project atelier --json`
- `bun nx run atelier:typecheck`
- `bun nx run atelier:test`
- `bun nx run atelier:doctor -- --json`

## Acceptance Criteria

- `product/apps/atelier` exists as an Nx application.
- `atelier doctor` can run through Nx.
- Harness Markdown frontmatter is parsed permissively.
- Duplicate IDs, missing IDs, invalid frontmatter, broken Markdown links, and stale `harness/ai-org` references are reported.
- JSON output is stable and machine-readable.

## Risks

- Existing harness documents may intentionally be missing frontmatter; M0 says loose areas must not fail globally.
- Some old references may be historical and should be warnings rather than errors.

## Open Questions

- Whether future GUI work should use the same app directory or split into a nested web surface after the CLI stabilizes.
