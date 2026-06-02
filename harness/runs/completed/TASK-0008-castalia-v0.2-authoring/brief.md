# TASK-0008: Castalia v0.2 Prompt Authoring Stability

## Context

Castalia v0.1 is a Rust Linux CLI MVP for selecting, rendering, and copying
local Markdown prompts. The v0.2 roadmap focuses on making prompt authoring
safer before any desktop editor or sync workflows are added.

## Goal

Implement the Castalia v0.2 roadmap items:

- stricter schema validation
- better error messages
- conflict-safe ids
- `castalia new`
- `castalia edit`
- `castalia inspect`

## Scope

- `product/apps/castalia/**`
- `harness/knowledge/product-specs/castalia/**`
- this task folder

## Non-Goals

- Do not build the Tauri desktop editor.
- Do not add cloud sync, browser extension behavior, or Home Manager options.
- Do not migrate prompts away from plain Markdown files.
- Do not introduce app-specific logic into shared packages.

## Acceptance Criteria

- Existing v0.1 commands keep working.
- `castalia validate` reports actionable validation issues across all prompt
  files instead of stopping at the first parse failure.
- `castalia inspect <query>` shows prompt metadata, path, slots, preview, and
  validation status.
- `castalia new <id>` creates a new prompt file without overwriting an existing
  file or conflicting with existing prompt ids/aliases.
- `castalia edit <query>` opens the resolved prompt in `$VISUAL` or `$EDITOR`
  and validates after the editor exits.
- `bun nx run castalia:verify` passes.
