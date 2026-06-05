# at-ctrl-004 Acceptance Proof

```yaml
record_id: at-ctrl-004-acceptance-2026-06-04
packet_id: at-ctrl-004
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T00:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Matrix Upgrade Audit

### Before (Round 1)

- `CONTRACT_TO_BUILD_MATRIX.md` had the matrix table and a 17-column `required_columns` list.
- The matrix did not have an explicit row shape document; it had only `required_columns` and the `Broad rows` warning.
- The join table state file used a 19-column list with `current_contract_testability` but no `deferral_state`.
- `SPEC_READ_PLAN.md` had the DAG Node Section Read Table and a one-sentence forward reference to DAG-02 coverage extraction.

### After (Round 2 at-ctrl-004)

- `CONTRACT_TO_BUILD_MATRIX.md`:
  - Adds the full 20-column row shape document with required/conditional columns.
  - Adds an explicit **Row Shape (Enforced by Join Table)** table mapping each column to its description and required-or-conditional status.
  - Adds an explicit **Rejection Rules** list enumerating nine row-level rejection conditions.
  - The matrix table itself is unchanged (it was already comprehensive).
- `state/traceability/dag-02-join-table-2026-06-04.yaml`:
  - Adds `deferral_state` to the `required_columns` list.
  - Adds `deferral_state_vocabulary` enumerating the five valid states.
  - Adds `rejection_rules` with nine conditions mirroring the matrix.
  - The `rule` line now requires `deferral_state=concrete` in addition to `traceability_status=concrete` and no open `blocker_id`.
- `SPEC_READ_PLAN.md`:
  - Adds an `Assertion-Row Routing` subsection describing the augmentation strategy: once join-table rows are concrete, the assertion-row routing supersedes document-level routing for product-code packets.

## Row Shape Audit

| Column | Required | Present in join table? | Present in matrix? |
|---|---|---|---|
| `invariant_id` | yes | yes (as `invariant_ids` list) | yes |
| `dag_node_id` | yes | yes | implicit (matrix column `Dependency IDs`) |
| `source_sections` | yes | yes | yes (matrix column `Source spec`) |
| `exact_assertion` | yes | yes | yes (matrix column `Normative claim`) |
| `owned_fields_or_enums` | yes | yes | yes (matrix column `Schema`) |
| `closed_enum_values` | yes | yes | yes |
| `negative_cases` | yes | yes | implicit |
| `fixture_id` | yes | yes | yes (matrix column `Fixture`) |
| `validation_gate_ids` | yes | yes | yes (matrix column `Test`) |
| `allowed_files_ref` | yes | yes | implicit |
| `proof_level` | yes | yes | implicit |
| `phase_scope` | yes | yes | yes (matrix column `Phase Gate`) |
| `deferral_state` | yes (NEW) | yes (added) | n/a |
| `current_contract_testability` | yes | yes | implicit |
| `required_for_pg_f` | yes | yes | yes (matrix column `Blocker behavior`) |
| `waiver_id` | conditional | yes | yes (matrix column `Waiver`) |
| `waiver_expiry` | conditional | yes | yes |
| `owner_role` | yes | yes | implicit |
| `traceability_status` | yes | yes | implicit |
| `blocker_id` | yes | yes | yes (matrix column `Blocker`) |

All 20 columns: present.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-004 diff? |
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
