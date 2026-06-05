# at-ctrl-001 Acceptance Proof

```yaml
record_id: at-ctrl-001-acceptance-2026-06-04
packet_id: at-ctrl-001
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T00:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Schema Migration Audit

### Before (Round 1)

- `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` had a near-schema with `package_manager`, `nx_projects`, `atelier_project`, `source_roots`, `test_roots`, `fixture_roots`, `generated_roots`, `durable_evidence_roots`, `existing_atelier_modules`, `current_git_status`, `dirty_worktree_state`, `editable_roots_for_*`, `non_editable_roots`.
- `state/repository-inventory/repo-inventory-2026-06-04.md` matched that schema.

### After (Round 2 at-ctrl-001)

- `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` now prescribes the user-specified schema:
  - `package_manager`
  - `workspace_system` (new)
  - `projects[].id, root, source_roots, test_roots, fixture_roots, generated_roots, commands.{typecheck,test,check,lint}` (new structure)
  - `atelier_modules[].path, detected_role, existing_interfaces` (new structure)
  - `git_state.{status_porcelain, staged_files, unstaged_files, untracked_files}` (new structure)
  - `editable_roots.{source, tests, fixtures, generated}` (new structure)
  - `forbidden_roots` (new top-level list)
- Adds a new `Inventory Validity Criteria` section with eight explicit criteria.
- Adds a new `Hard Prerequisites` section stating DAG-10 depends on DAG-04 and DAG-05, and that no implementation packet may be dispatched until DAG-01B and DAG-01C pass.
- `state/repository-inventory/repo-inventory-2026-06-04.md` now matches the new schema, with `commands.check: bun nx run atelier:check` resolving to a `command_discovery_ref`.

## Inventory Validity Audit

| Criterion | Met? | Evidence |
|---|---|---|
| `package_manager` in allowed enum | yes | `bun` |
| `workspace_system` in allowed enum | yes | `nx` |
| `atelier_modules` non-empty with role and interfaces | yes | 18 modules listed |
| `editable_roots.{source,tests,fixtures,generated}` all present | yes | all four present, source/tests/fixtures/generated paths explicit |
| `forbidden_roots` includes product specs and immutable control docs | yes | product specs and all 10 immutable control docs listed |
| `git_state.untracked_files` recorded | yes | only `harness/knowledge/implementation-control/` |
| `product_spec_drift_status` clean with proof refs | yes | `clean`, refs `VG-001` and `VG-036` proofs |
| `commands.check` resolves to command_discovery_ref | yes | `bun nx run atelier:check`, resolved in `state/command-discovery/command-discovery-2026-06-04.md` |

All eight validity criteria: passed.

## DAG Hard Prerequisite Audit

| Hard prerequisite | Verified? | Evidence |
|---|---|---|
| `DAG-01B` (Repository implementation inventory) exists | yes | IMPLEMENTATION_DAG.md line 39 |
| `DAG-01C` (Command and target discovery) exists | yes | IMPLEMENTATION_DAG.md line 40 |
| `DAG-02A` (Fixture/test oracle alias registry) exists | yes | IMPLEMENTATION_DAG.md line 42 |
| `DAG-10` depends on `DAG-04` and `DAG-05` | yes | IMPLEMENTATION_DAG.md line 50: `Depends On: DAG-04, DAG-05, DAG-06` |
| Hard prerequisites section in boundary doc | yes | new `Hard Prerequisites` section in `REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md` |
| Fail-closed rules in packet protocol | yes | fail-closed rule added in `AGENT_PACKET_PROTOCOL.md`: ordinary-implementation packet rejected if `repo_inventory_ref` does not exist or fails `inventory_validity_criteria` |

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-001 diff? |
|---|---|
| weakening gates | No |
| deleting dependencies | No |
| broadening completion criteria | No |
| relaxing product-spec immutability | No |
| adding compatibility aliases for removed commands | No |
| broadening fixture scope without matrix-backed reason | No |
| narrowing expected diff shape to hide required work | No |
| downgrading blocker severity without evidence | No |
| converting executable requirements into assumptions | No |
| allowing pending commands to satisfy phase gates | No |

All ten forbidden actions: clear.

## Gate Runs

| Gate | Status | Evidence |
|---|---|---|
| VG-001 | passed | product-spec staged/unstaged/status/HEAD diffs are empty |
| VG-036 | passed (pre-existing) | state/validations/VG-036-product-spec-hash-2026-06-04.md |
| VG-037 | to be re-recorded after at-ctrl-000..004 land | state/validations/VG-037-control-doc-baseline-2026-06-04.md |
| VG-038 | to be recorded with structured diff audit | state/validations/VG-038-test-integrity-mechanical-2026-06-04.md |
| VG-000 | passed (pre-existing) | state/command-discovery/command-discovery-2026-06-04.md |
