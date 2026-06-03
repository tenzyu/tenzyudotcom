# Handoff: Commit 4 (M15: Selector v2)

## Done
- Selector v2 graph-backed context planning
- Permission envelope computation from Artifact Graph
- CLI `--selector-v2` flag
- v1 backward compatibility verified

## Next (Commit 5: M15.5)
- Task and Role Authoring Core — `src/core/tasks.ts`
  - TaskArtifact type, createTask, splitTask, assignTask, taskStatus, closeTask
  - Role editing with selector impact preview
  - CLI: task create/split/assign/status/close, role create/edit

## Known issues
- `context.ts:181` — pre-existing regex control character warning (no functional impact)
