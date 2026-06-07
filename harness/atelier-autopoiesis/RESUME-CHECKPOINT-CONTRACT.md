# Resume Checkpoint Contract

This pack is designed to resume a long-running goal, not discard useful progress.
A swollen transcript is not a reliable memory substrate. The repository state and compact checkpoints are.

## Resume rule

When continuing from an existing OpenCode goal run:

```txt
1. Do not delete or ignore existing implementation changes.
2. Do not replay or reread the entire prior transcript.
3. Read current git/status, compact goal todo if visible, and existing reports/checkpoints.
4. Create or update a compact checkpoint before dispatching more subagents.
5. Continue from the checkpoint and repository state.
```

## Checkpoint path

```txt
harness/atelier-autopoiesis/work/checkpoints/latest.json
```

The checkpoint must be compact and machine-readable:

```json
{
  "schema": "atelier.autopoiesis-checkpoint/v1",
  "updated_at": "ISO-8601",
  "active_work_order": "wo:<id>|null",
  "completed_work_orders": [],
  "open_findings": [],
  "commands_recently_run": [],
  "files_changed_since_start": [],
  "known_token_telemetry": {
    "input": 0,
    "cached_input": 0,
    "reasoning": null,
    "output": 0
  },
  "next_dispatch": []
}
```

## Compaction rule

Before every evaluator or implementer dispatch, the coordinator must pass only:

```txt
- work order JSON
- relevant compact checkpoint excerpt
- role-specific contract
- required file slices or symbol inventory
```

No subagent should receive the full prior conversation as context.
