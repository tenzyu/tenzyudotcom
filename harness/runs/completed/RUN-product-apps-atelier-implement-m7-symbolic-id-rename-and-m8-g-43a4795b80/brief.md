---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80.brief
title: "RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80 Brief"
status: active
summary: "Implement M7 (Symbolic ID Rename) and M8 (Generated Skills and Adapters) from the Atelier roadmap"
tags:
  - harness
  - run
---

# Brief: RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80

## Intent

Implement M7 (Symbolic ID Rename) and M8 (Generated Skills and Adapters) from the Atelier roadmap.

## Background

The Atelier roadmap reaches the first batch of post-MVP milestones once M0–M6 are accepted. M7 makes symbolic id renames safe and global, and M8 turns hand-written adapter content into generated skills and root adapters so the harness stays reproducible. Both must be CLI-first and reuse the existing core rather than introducing a parallel surface.

## Goal

Add two new Atelier commands that operate on the current harness without breaking M0–M6 behavior.

- `atelier id rename OLD_ID NEW_ID [--write]` for global symbolic renames.
- `atelier generate [--write]` for refreshing generated skills and root adapters.

## Scope

Allowed files:

- `product/apps/atelier/src/core/**`
- `product/apps/atelier/src/cli.ts`
- `product/apps/atelier/src/index.ts`
- `product/apps/atelier/project.json`
- `product/apps/atelier/package.json`
- `product/apps/atelier/README.md`
- `product/apps/atelier/src/__tests__/**`
- `.harness/generated/**` (written by `atelier generate --write`)
- `harness/adapters/root/AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (overwritten by `atelier generate --write`)
- `harness/runs/active/RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80/**` (this run folder)

Forbidden by default:

- unrelated product apps or packages
- dependency changes unless required
- rewriting hand-authored knowledge or policies
- deleting completed run history
- editing `harness/adapters/tool/*` (those remain the human-authored source for adapter content)

## Non-Goals

- A new harness kind for generated skills beyond what the existing `unknown kind` warning policy tolerates.
- Auto-promotion of generated skill files into durable knowledge.
- Replacing `harness/adapters/tool/*` with generated content.
- Implementing M9 (MCP) or M10 (GUI).

## Constraints

- M7 must preview by default and require `--write` to actually mutate.
- M7 must refuse to clobber an existing `NEW_ID`.
- M7 must regenerate `.harness/generated/*.json` after a write.
- M8 must keep root adapters short (single screen of content per spec).
- M8 must not duplicate full knowledge bodies inside generated skills.
- Generated skills and root adapters must be reproducible: running `atelier generate --write` twice produces stable output.

## Role Assignment

- Primary: `role.domain.harness-engineer`
- Supporting: `role.core.implementer`
- Review: `role.core.reviewer`

## Worktree Isolation

The user explicitly said a worktree is not required for this run. All edits are applied on `develop` directly.

## Validation Commands

```bash
bun nx run atelier:typecheck
bun nx run atelier:test
bun nx run atelier:doctor
bun nx run atelier:index --check
bun nx run atelier:generate --write
bun nx run atelier:doctor -- --json | sed -n '/^{/,/^}$/p' | bun -e '...'
```

## Acceptance Criteria

- `atelier id rename OLD_ID NEW_ID` previews affected files without writing.
- `atelier id rename OLD_ID NEW_ID --write` updates frontmatter, body backticked references, generated JSON, and active run manifests.
- `atelier id rename` refuses when `NEW_ID` already exists.
- `atelier generate --write` produces `.harness/generated/skills/atelier.md`, per-workflow skills, per-role skills, and short `harness/adapters/root/{AGENTS,CLAUDE,GEMINI}.md`.
- Generated root adapters stay under the spec's "short" rule.
- All existing M0–M6 tests still pass.
- `atelier doctor` reports no new diagnostics introduced by the new generated files.

## Risks

- Generated root adapters may diverge from the previously hand-written `harness/adapters/root/AGENTS.md` style. The detailed guidance is preserved in `harness/adapters/tool/AGENTS.md` and in the new `atelier.md` skill, but reviewers should compare.
- The rename scan replaces backticked ID references in Markdown body text but ignores plain (unbackticked) mentions. Future renames of plain-text ID mentions will still need manual review.
- The generated `id: skill.atelier` and per-skill ids are new symbols. They live under `.harness/generated/` (gitignored) and therefore do not participate in `atelier doctor`'s id table.
