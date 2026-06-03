# Review: Commit 4 (M15: Selector v2)

## What was done
- Implemented `SelectorV2Input`, `SelectorV2Trace`, `PermissionEnvelope` types in schema.ts
- Added `buildGraphContextPlan()` — graph-backed context plan builder with `--selector-v2` opt-in
- Added `computePermissionEnvelope()` — derives role permissions from Artifact Graph
- Updated CLI: `atelier context plan --selector-v2`
- Added 3 tests covering compatibility, trace output, and permission envelope

## Design decisions
- `buildGraphContextPlan` wraps `buildContextPlan` (not replaces it) — v1 compatibility preserved when `--selector-v2` is omitted
- Traces include `role`, `phase`, `budget`, `permission` types — extensible for `task`, `scope`, `diff`, `risk` in future
- Permission envelope reads from `harness/atelier/graph.json` — falls back to defaults if graph absent
