# TASK-0010: Castalia v0.2.5 Release

## Context

v0.2.5 replaces `rofi` as Castalia's supported launch path. The launcher should
be lightweight, start on demand, exit after copy, avoid daemon behavior, and use
Castalia-owned UI for slot input by default.

## Goal

Implement and verify the v0.2.5 launcher release.

## Scope

- `product/apps/castalia/**`
- `harness/knowledge/product-specs/castalia/**`
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release**`

## Non-Goals

- Do not build the v0.3 Tauri desktop prompt manager.
- Do not add prompt management features to the launcher.
- Do not keep `rofi` as a supported command.
- Do not target Windows or macOS in this release.

## Acceptance Criteria

- `castalia launch` exists and is the supported launch path.
- `castalia rofi` is no longer a supported command.
- Launcher selection shows prompt titles and previews.
- Launcher slot input defaults to Castalia-owned UI.
- `$EDITOR`/`$VISUAL` is available as a slot input escape hatch.
- No daemon or resident process is introduced.
- `bun nx run castalia:verify` and `bun nx run castalia:build` pass.
