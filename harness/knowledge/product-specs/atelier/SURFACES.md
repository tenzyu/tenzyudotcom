---
schema: harness/v1
kind: knowledge
id: knowledge.product-spec.atelier-surfaces
title: Atelier Surfaces
status: active
pattern: simple
tags:
  - product:atelier
  - subject:surfaces
  - domain:harness
  - layer:product
  - status:active
affordances:
  declared:
    - context
    - check-candidate
    - test-source
---

# Atelier Surfaces

## 1. Scope

This document is the single source of truth for active product surfaces.

It owns:

- active CLI command names and arguments;
- removed CLI command names (do-not-advertise list);
- MCP tool names;
- GUI labels;
- generated prompt surfaces;
- adapter output surfaces;
- README usage examples;
- parity test scope.

`contract.md` defines behavioral invariants (e.g. "active surfaces must agree", "removed surfaces must not be advertised"). This document enumerates the surfaces themselves.

If a behavior changes, edit `contract.md`. If a surface name or label changes, edit this document. The two are intentionally separate so that durable contract behavior does not have to be revised every time a command is renamed or relabeled.

## 2. CLI Active Commands

### 2.1 Top-Level Commands

```txt
atelier scan                  observe project artifacts; build the artifact graph snapshot
atelier doctor                report harness health
atelier graph                 print the current artifact graph snapshot
atelier graph status          summarize graph health, staleness, and orphans
atelier reconcile             compare the graph against the filesystem; report drift
atelier repair                preview what reconcile would change (dry-run)
atelier context plan          produce a read-only attention plan for a task
atelier policy check          evaluate governance policy for a path, command, or tool
atelier policy explain        explain policy rules and their decisions
atelier controls list         list all control mechanisms
atelier controls coverage     report which knowledge items have which controls
atelier controls missing      list knowledge items that lack one or more controls
```

### 2.2 Run Subcommands

```txt
atelier run create --task <task-id>
atelier run list [--status active|completed|blocked_waiting|blocked_terminal|forced_closed] [--json]
atelier run inspect <run-id>
atelier run resume <run-id>
atelier run handoff <run-id> --append "<text>"
atelier run verify <run-id> --list
atelier run verify <run-id> --record --from <verification-record.json> --json
atelier run complete <run-id> --json
atelier run force-close <run-id> --reason "<reason>" --json
atelier run export <run-id> --adapter <adapter-id> --out <path>
```

`atelier run force-close` is the only command that emits `run_forced_closed`. It is permitted only when the run is in `run_blocked_terminal` state. Calling it on a run in `resumed` or `blocked_waiting` state is an error and returns `ATELIER-INVARIANT-VIOLATION`.

`atelier run export` produces a canonical packet for the named adapter. Stage 0 supports `human-shell` and `noop-reference`. Stage 1+ adds the runtime-specific adapter ids from `ADAPTER_CONTRACT.md` §8.1.

`atelier run verify <run-id> --record --from <verification-record.json> --json` is the canonical v5.1 recording surface. The CLI reads a complete `verification_record` JSON object from `<verification-record.json>` and emits the matching `verification_recorded` event per `contract.md` §12.2 and the matching `artifact_accepted` event per `EVENT_MODEL.md` §5. The record MUST conform to `VERIFICATION_SCHEMA.md` §4. The CLI rejects the record if:

- `status` is outside the closed lattice;
- `status=passed` and `evidence_artifact_refs` is empty;
- `status=skipped` and `skip_reason_code` is missing or not in `VERIFICATION_SCHEMA.md` §6.1;
- `status=unavailable` and `unavailable_reason_code` is missing or not in §6.2;
- `skip_reason_code=deferred_by_accepted_decision` and `decision_ref` is missing or invalid per `VERIFICATION_SCHEMA.md` §6.3;
- `durable_path` is missing or points under `.atelier/`.

The durable evidence rule per `VERIFICATION_SCHEMA.md` §9 applies: a `durable_path` commit is necessary but not sufficient; the CLI also emits the matching `artifact_accepted` event with the same `correlation_id`. The full-record-input design keeps the v5.1 CLI surface narrow and avoids the flag explosion that would be required to cover every verification record field inline.

### 2.3 Task Subcommands

```txt
atelier task create --title <title> --description <description> [--phase <phase>] [--scope <path>] [--parent <task-id>]
atelier task status <task-id>
atelier task assign <task-id> [--role <role-id>] [--agent <agent-name>]
atelier task close <task-id> --outcome <completed|cancelled>
```

### 2.4 Argument and Output Conventions

- Long-form flags only. Short flags are not part of the contract.
- `<placeholder>` denotes a required positional argument.
- `--flag <value>` denotes a required flag value.
- `[--flag <value>]` denotes an optional flag.
- `--json` is the canonical machine-readable output flag.
- Errors must include a stable error code prefix (`ATELIER-`).
- Help output must list all active subcommands and must not list removed subcommands.

### 2.5 JSON Output Schemas for Priority Commands

The following commands must emit a stable JSON shape when `--json` is present. Field names are `snake_case`. The shapes are normative.

```txt
atelier context plan --json
  mutated:            boolean
  created_run:        boolean
  created_task:       boolean
  context_budget:
    artifact_slot_count:      integer
    estimated_tokens_full:    integer
    estimated_tokens_summary: integer
    budget_limit:             integer
    budget_policy:            enum[hard | soft | advisory]
  resolution_decisions:       array[resolution_decision_record]
  reading_order:              array[artifact_ref]
  exclusions:                 array[artifact_ref]
  freshness:
    graph_hash:               string
    stale:                    boolean
  next_actions:               array[string]

atelier run complete <run-id> --json
  run_id:               string
  closure_state:        enum[completed_clean | completed_dirty | run_blocked_terminal]
  event:                enum[run_completed_clean | run_completed_dirty | run_blocked_terminal]
  required_passed:      integer
  required_skipped:     integer
  required_unavailable: integer
  required_not_run:     integer
  required_unknown:     integer
  hard_block_source:    string | null
  emitted_at:           RFC3339 timestamp
  evidence_refs:        array[artifact_ref]

atelier run force-close <run-id> --json
  run_id:               string
  prior_state:          enum[run_blocked_terminal]
  event:                enum[run_forced_closed]
  reason:               string
  forced_by:            actor_id
  forced_at:            RFC3339 timestamp

atelier run verify <run-id> --record --from <verification-record.json> --json
  record_id:            string
  check_id:             string
  status:               enum[passed | failed | skipped | unavailable | not-run | unknown]
  reason_code:          string | null
  skip_reason_code:     string | null
  unavailable_reason_code: string | null
  decision_ref:         string | null
  evidence_artifact_refs: array[artifact_ref]
  command_invocation:   object
  tool_version:         string
  recorded_by:          actor_id
  recorded_at:          RFC3339 timestamp
  durable_path:         string
  source_hashes:        object
  notes:                string | null

atelier graph --json
  graph_hash:           string
  nodes:                array[graph_node]
  edges:                array[graph_edge]
  experimental_subgraphs: array[experimental_subgraph_ref]
```

A command listed above must emit exactly the fields shown. Additional fields are forbidden. A field shown above must be present, even if the value is null. Field omission is a contract violation.

## 3. CLI Removed Commands (Do-Not-Advertise)

The following command names are removed. They must not appear in:

```txt
- CLI help output
- MCP tool descriptions
- GUI labels
- generated next actions
- retry commands
- recovery output
- active adapter instructions
- README usage examples
- product spec active examples
```

Removed names:

```txt
atelier run init
atelier run status
atelier run close
atelier context render
atelier context expand
atelier index
atelier knowledge
atelier repo map
atelier repo owner
atelier generate
```

Do not introduce compatibility aliases. If a removed command must be referenced for historical reasons, the reference must be inside an archive, a historical note, or a migration guide, never inside an active surface.

## 4. MCP Tool Surface

MCP tool names mirror the CLI command path with a stable prefix. Each tool must declare:

```txt
name            (string, stable)
description     (string, must not mention removed commands)
input_schema    (JSON Schema)
output_schema   (JSON Schema)
```

Naming convention:

```txt
atelier_<command>_<subcommand>

Examples:
  atelier_run_create
  atelier_run_list
  atelier_run_inspect
  atelier_run_resume
  atelier_run_handoff
  atelier_run_verify
  atelier_run_complete
  atelier_run_force_close
  atelier_run_export
  atelier_task_create
  atelier_task_status
  atelier_task_assign
  atelier_task_close
  atelier_context_plan
  atelier_scan
  atelier_doctor
  atelier_graph
  atelier_graph_status
  atelier_reconcile
  atelier_repair
  atelier_policy_check
  atelier_policy_explain
  atelier_controls_list
  atelier_controls_coverage
  atelier_controls_missing
```

An MCP tool description must not advertise a CLI command that has been removed. The parity test for MCP vs CLI is listed in §9.

## 5. GUI Labels

GUI labels must map unambiguously to canonical surfaces (CLI command, MCP tool, or adapter output).

GUI labels may use human-readable text where appropriate (e.g. "Plan context" is permitted if the underlying action is `atelier context plan`).

Where command or API parity matters, the label must expose or link the exact canonical name. Acceptable forms:

```txt
- Visible sublabel showing the command.
- Tooltip showing the command.
- Copy-as-command affordance.
- Command line displayed beside the label.
```

GUI labels must not:

```txt
- introduce decorative aliases that look like new product surfaces;
- reference removed commands;
- imply capabilities the canonical surface does not have;
- advertise a contract violation as a feature.
```

The label-to-canonical mapping is the source of truth for GUI parity. The mapping is referenced by the parity test in §9.

## 6. Generated Prompt Surfaces

The following surfaces emit prompt-like text. They are part of the contract surface inventory.

```txt
- Resume prompt emitted at the top of a resumed run packet.
- Next-action prompt emitted after a context plan.
- Retry prompt emitted after a recoverable failure.
- Recovery output emitted after an unrecoverable failure.
- Adapter-specific prompt emitted by each adapter (see §7).
- Handoff prompt emitted when a task is split or handed off.
```

Invariants:

- A resume prompt must begin with the canonical handoff reading order (see `contract.md` §12).
- A next-action prompt must not reference removed commands.
- A retry prompt must not propose a removed command as the recovery path.
- An adapter-specific prompt must declare its runtime id (see `ADAPTER_CONTRACT.md` §3).

## 7. Adapter Output Surfaces

Each runtime adapter has an output surface. The output surface name follows the runtime id from `ADAPTER_CONTRACT.md` §3.

```txt
- codex output surface
- opencode output surface
- claude-code output surface
- chatgpt output surface
- gemini output surface
- human/shell output surface (Stage 0)
- custom-organization output surfaces (Stage 2+)
```

Each adapter output surface must:

- declare its `runtime` field in the canonical result;
- not alias removed commands;
- not invent verification records;
- not mutate artifact semantics;
- pass the parity fixture in `ADAPTER_CONTRACT.md` §7.

## 8. README Usage Surface

README usage examples must use only active commands. The README in this directory is itself a usage surface and must be the most-up-to-date example.

Invariants:

- Every CLI example uses a command in §2.
- No example uses a command in §3.
- Every example that emits a next action points to an active next action.

## 9. Parity Test Scope

The following pairs of surfaces must agree. Disagreement is a contract violation.

```txt
CLI help          == MCP tool list
CLI help          == GUI label map
CLI help          == README usage examples
CLI help          == Generated next actions
CLI help          == Adapter output surfaces
CLI help          == Removed command list (inverse; removed commands must not appear)
```

The parity test is referenced in `CONTRACT_TEST_MATRIX.md` under the test "Active surface inventory test".

## 10. Surface Change Procedure

To add, remove, or rename a surface:

1. Edit this document. The new surface name, its purpose, and its parity scope must be specified.
2. If the change alters a behavioral invariant, also edit `contract.md`.
3. Update the parity test scope (§9) if the change introduces or removes a parity pair.
4. Update the README usage examples in `README.md` if the change is user-visible.
5. Update `CONTRACT_TEST_MATRIX.md` to map the surface change to a test or to a waiver with expiry.

Silent surface changes are forbidden. A change in this document is a contract change.

## v5 Revision Notes

- Added `atelier run force-close <run-id> --reason "<reason>" --json` to §2.2. The command emits `run_forced_closed` and is permitted only when the run is in `run_blocked_terminal` state.
- Added `atelier run export <run-id> --adapter <adapter-id> --out <path>` to §2.2. Stage 0 supports `human-shell` and `noop-reference`. Stage 1+ adds runtime-specific adapter ids.
- Updated `atelier run list` status filter to include blocked-state filters and `forced_closed`.
- Updated `atelier run verify --record` to use canonical flags (`--check`, `--status`, `--reason`, `--json`) instead of the prior `::` separator. The new form aligns with the `verification_record` schema in `VERIFICATION_SCHEMA.md` §4.
- Added §2.5 "JSON Output Schemas for Priority Commands" with normative field shapes for `atelier context plan`, `atelier run complete`, `atelier run force-close`, `atelier run verify --record`, and `atelier graph`. Field names are `snake_case`.
- Added corresponding MCP tool names `atelier_run_force_close` and `atelier_run_export` in §4.

## v5.1 Revision Notes

- §2.2 `atelier run verify <run-id> --record` rewrites the recording surface to use full-record input: `--from <verification-record.json>`. The previous flag-bundle form (`--check`, `--status`, `--reason`) is replaced. The full-record input is the canonical v5.1 surface; it keeps the CLI narrow and avoids the flag explosion that would be required to cover every `VERIFICATION_SCHEMA.md` §4 field inline.
- §2.2 added a paragraph describing the validation rules and the durable evidence pairing per `VERIFICATION_SCHEMA.md` §9.
- §2.2 `atelier run force-close` boundary text updated: force-close is permitted only from `run_blocked_terminal`, never from `resumed` or `blocked_waiting`. Calls from non-`run_blocked_terminal` states return `ATELIER-INVARIANT-VIOLATION`.
- §2.5 `atelier run verify --record --json` JSON output schema expanded to include `command_invocation`, `tool_version`, `recorded_by`, `source_hashes`, `notes`. These are required for the JSON to conform to the v5.1 verification record schema.
