# at-ctrl-005 Acceptance Proof

```yaml
record_id: at-ctrl-005-acceptance-2026-06-04
packet_id: at-ctrl-005
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T02:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Join Table Expansion Audit

### Before (Round 2 at-ctrl-004)

- The DAG-02 join table at `state/traceability/dag-02-join-table-2026-06-04.yaml` had 6 concrete rows (DAG-00, DAG-01, DAG-01B, DAG-01C, DAG-02, DAG-02A).
- 8 placeholder entries in `implementation_rows_blocked_until_concrete` covered DAG-04..DAG-53.
- `traceability_status: blocked_until_field_split` and `product_code_packet_authorization: blocked` for all rows from DAG-04 onwards.
- BLK-TRACEABILITY-001 was open with `affected_dag_nodes: [DAG-04 to DAG-53]`.

### After (Round 2 at-ctrl-005)

- The join table now has 48 rows: 6 existing + 42 new concrete rows.
- 42 new rows are added for DAG-04 (6), DAG-05 (5), DAG-06 (9), DAG-07 (6), DAG-08 (10), DAG-09 (3), DAG-10 (3).
- Each new row has all 20 required columns populated with no placeholders.
- Every new row has `deferral_state: concrete`, `traceability_status: concrete`, `blocker_id: null`, `phase_scope: PG-1`, `required_for_pg_f: true`, `waiver_id: null`, `waiver_expiry: null`, `current_contract_testability: executable`.
- The `implementation_rows_blocked_until_concrete` placeholder list is removed.
- A new `implementation_rows_concrete_now` section records the previously blocked invariant groupings that are now concrete, plus a carryover entry for DAG-11..DAG-53 routed to `at-ctrl-005B`.
- `product_code_packet_authorization: allowed_when_rows_for_target_node_are_concrete`.
- `rejection_rules` and `deferral_state_vocabulary` are unchanged.

## Row Completeness Audit

| Column | Required | All 42 new rows populated? |
|---|---|---|
| `dag_node_id` | yes | yes |
| `invariant_ids` | yes | yes (one invariant per row) |
| `source_sections` | yes | yes (path#section) |
| `exact_assertion` | yes | yes (verbatim from product spec) |
| `owned_fields_or_enums` | yes | yes |
| `closed_enum_values` | yes | yes (or N/A when not applicable) |
| `negative_cases` | yes | yes (>=2 per row) |
| `fixture_id` | yes | yes (from CONTRACT_TEST_MATRIX.md) |
| `validation_gate_ids` | yes | yes (real VG-NNN IDs) |
| `allowed_files_ref` | yes | yes (product code root globs) |
| `proof_level` | yes | yes (machine-readable join table plus coverage proof) |
| `phase_scope` | yes | yes (PG-1) |
| `deferral_state` | yes | yes (concrete) |
| `current_contract_testability` | yes | yes (executable) |
| `required_for_pg_f` | yes | yes (true) |
| `waiver_id` | yes (null) | yes (null) |
| `waiver_expiry` | yes (null) | yes (null) |
| `owner_role` | yes | yes (catalog role) |
| `traceability_status` | yes | yes (concrete) |
| `blocker_id` | yes (null) | yes (null) |

## Per-DAG Row Counts

| DAG node | Invariants | Rows added | Owner role |
|---|---|---|---|
| DAG-04 | AT-INV-004 to AT-INV-009 | 6 | graph kernel implementer |
| DAG-05 | AT-INV-029 to AT-INV-033 | 5 | event lifecycle implementer |
| DAG-06 | AT-INV-014 to AT-INV-022 | 9 | verification engine implementer |
| DAG-07 | AT-INV-034 to AT-INV-039 | 6 | surface/CLI implementer |
| DAG-08 | AT-INV-040 to AT-INV-049 | 10 | adapter implementer |
| DAG-09 | AT-INV-053 to AT-INV-055 | 3 | event lifecycle implementer |
| DAG-10 | AT-INV-050 to AT-INV-052 | 3 | governance/policy boundary implementer |
| **Total** | | **42** | |

## Placeholder Grep Audit

`grep -nE '\b(TBD|derive|future fixture|FIXME|XXX)\b'` over the 42 new rows returns zero hits. All `negative_cases` are concrete invalid inputs. All `source_sections` reference real `harness/knowledge/product-specs/atelier/...md#section` paths. All `fixture_id` values match the v5.1 fixture layout in `CONTRACT_TEST_MATRIX.md` §1a.

## Source Section Audit

Each new row's `source_sections` references a real section heading from the corresponding product spec. Cross-checked against:

- `GRAPH_SEMANTICS.md` §2, §3, §4, §4.1, §4.4, §4.4.1, §4.4.2, §4.5, §6.3
- `EVENT_MODEL.md` §2, §3, §5, §6, §7, §9
- `VERIFICATION_SCHEMA.md` §2, §3, §4, §5, §6, §6.1, §6.2, §6.3, §7, §8, §9
- `SURFACES.md` §2, §2.2, §2.4, §2.5, §3, §4, §5, §9
- `ADAPTER_CONTRACT.md` §1, §2, §3, §4, §5, §6, §7.1, §7.2, §8.0, §8.1, §8a, §8a.1, §10
- `RUN_PACKET_MODEL.md` §2, §3, §4, §6
- `WRITE_AUTHORITY_MATRIX.md` §2, §3, §4
- `EXAMPLES.md` Example 6 (for AT-INV-020 decision_ref)

## Validation Gate Audit

All `validation_gate_ids` reference real VG-NNN gate IDs from `VALIDATION_GATE_REGISTRY.md`. The gate set per DAG node matches the structured gate records in `state/gates/structured-gates-2026-06-04.yaml`:

| DAG node | Gate set used |
|---|---|
| DAG-04 | VG-005, VG-006, VG-034, VG-038 |
| DAG-05 | VG-011, VG-013, VG-040, VG-041, VG-044 |
| DAG-06 | VG-008, VG-009, VG-010, VG-024, VG-042, VG-043 |
| DAG-07 | VG-018, VG-019, VG-039 |
| DAG-08 | VG-021, VG-022, VG-023, VG-032 |
| DAG-09 | VG-020, VG-033 |
| DAG-10 | VG-026A, VG-026B, VG-043, VG-034 |

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-005 diff? |
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

## Product-Spec Immutability Audit

```text
git diff --name-status -- harness/knowledge/product-specs/atelier  -> empty
git diff --cached --name-status -- harness/knowledge/product-specs/atelier  -> empty
git status --porcelain=v1 -- harness/knowledge/product-specs/atelier  -> empty
```

No product spec was edited.

## Join Table SHA-256

See the `notes` section of the packet record for the recorded hash. The immutable control-doc baseline is unchanged; only the mutable `state/traceability/dag-02-join-table-2026-06-04.yaml` hash changed.

## Blocker Status Audit

`BLK-TRACEABILITY-001` is moved from `open` to `partial_resolution`. The blocker is not closed because DAG-11..DAG-53 join-table expansion remains in `at-ctrl-005B` scope. Product code packet dispatch is no longer universally blocked: rows for DAG-04..DAG-10 are now `deferral_state=concrete` and `traceability_status=concrete`, subject to per-DAG dependency resolution (e.g., DAG-10 still needs DAG-04, DAG-05, DAG-06, VG-026A, and VG-043 to pass before a `schema-implementer` packet can be dispatched).
