<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Long-Run Execution Protocol

Product DAG execution remains **out of scope** for this task.

After `bun run ready` reports `status: ready`, implementation runs through CLI packets.

## Parent Agent Loop

```bash
bun run status
bun run frontier
bun run resume
bun run packet:create -- --dag <DAG-ID>
bun run packet:dispatch -- --packet state/packets/<PACKET>.yaml
bun run packet:complete -- --packet state/packets/<PACKET>.yaml
```

## Subagent Loop

```bash
bun run packet:context -- --packet state/packets/<PACKET>.yaml
```

## Completion

```bash
bun run evidence:add
bun run packet:complete
bun run validate
bun run frontier
```

The parent agent does **not** read all subagent context. It relies on packet status, evidence records, validation gates, and ready/frontier reports.

## Subagent Handoff Schema

`atelier.subagent-handoff/v1`

- Required: `run_id`, `dag_node_id`, `files_changed`, `tests_written`, `vg_results`, `evidence_paths`, `blockers`
- Optional: `summary` (≤ 80 characters)
- vg_results values: `passed | failed | skipped | blocked`
- files_changed / tests_written paths must be inside `allowed_files` of the parent packet
- prose body rejected
- extra narrative fields rejected

Validation: `bun run subagent:validate-handoff <file>`

## Current Status

- ready: PHASE_0, PHASE_0.5, PHASE_1, PHASE_2, PHASE_3, PHASE_4, PHASE_5
- blocked: (none)
- active_packets: (none)
- next_command: bun run packet:create -- --dag PHASE_0
