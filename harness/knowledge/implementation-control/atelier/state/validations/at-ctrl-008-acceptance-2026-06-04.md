# at-ctrl-008 Acceptance Proof

```yaml
record_id: at-ctrl-008-acceptance-2026-06-04
packet_id: at-ctrl-008
packet_type: control-doc-repair
execution_mode: mother_agent_direct_control_doc_repair
subagent_dispatched: false
ran_at: 2026-06-04T03:00:00Z
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
status: passed
```

## Mission Audit

The DAG Node Range Rule is now an explicit, on-page constraint in
`IMPLEMENTATION_DAG.md`, with a cross-reference in
`SUBAGENT_ROLE_CATALOG.md`. A careless dispatcher that reads a
`DAG-NN_to_DAG-MM` row as "one packet covers the range" now has an
explicit prohibition to consult.

### Before

- The `## DAG Nodes` table in `IMPLEMENTATION_DAG.md` contained rows
  with `DAG-NN_to_DAG-MM` Node IDs (e.g. `DAG-21_to_DAG-25`,
  `DAG-31_to_DAG-34`, `DAG-35_to_DAG-38`, `DAG-41_to_DAG-43`,
  `DAG-45_to_DAG-46`, `DAG-47_to_DAG-50`) but no rule clarifying that
  these are documentation-only ranges.
- `SUBAGENT_ROLE_CATALOG.md` had canonical split rules per role, but
  the DAG itself was ambiguous: a dispatcher could read a
  `DAG-NN_to_DAG-MM` row as a single dispatchable packet covering the
  range.
- No cross-reference linked the role catalog to the DAG, and no rule
  on the DAG page pointed back to the role catalog.

### After

- A new `## DAG Node Range Rule` section sits at the top of the
  `## DAG Nodes` table in `IMPLEMENTATION_DAG.md`, immediately before
  the table header. It states that:
  - each row whose Node ID is a `DAG-NN_to_DAG-MM` range is
    documentation-only;
  - per-packet dispatch must split the range into individual `DAG-NN`
    packets according to `SUBAGENT_ROLE_CATALOG.md` canonical splits
    before any subagent is dispatched;
  - a single subagent packet must never span a `DAG-NN_to_DAG-MM`
    range.
- A new cross-reference sentence is added in the
  `## Global Role Limits` section of `SUBAGENT_ROLE_CATALOG.md`,
  immediately after the immutable-control-doc editing rule, stating:
  "When the DAG row is a range (`DAG-NN_to_DAG-MM`), the canonical
  split in this catalog is authoritative; never dispatch a single
  packet that covers a range. See `IMPLEMENTATION_DAG.md` §
  'DAG Node Range Rule'."
- `IMPLEMENTATION_LEDGER.md` Packet Status table has a new row for
  `at-ctrl-008` referencing this acceptance proof.
- `IMPLEMENTATION_LEDGER.md` Validation History table has a new row
  for `at-ctrl-008` with timestamp `2026-06-04T03:00:00Z` and status
  `passed`.

## Diff Scope Audit

| File | Change | Effect on DAG / gates / completion |
|---|---|---|
| `IMPLEMENTATION_DAG.md` | new `## DAG Node Range Rule` section inserted at the top of the `## DAG Nodes` table | none on DAG nodes, dependencies, gates, or completion criteria |
| `SUBAGENT_ROLE_CATALOG.md` | new cross-reference sentence inserted in `## Global Role Limits` | none on canonical splits, roles, or forbidden actions |
| `IMPLEMENTATION_LEDGER.md` | one new row in Packet Status table, one new row in Validation History table | append-only ledger update; no status of existing rows changed |
| `state/packets/at-ctrl-008.yaml` | created | new packet record |
| `state/validations/at-ctrl-008-acceptance-2026-06-04.md` | created | new acceptance proof |

No DAG node row was added, removed, edited, or reordered. No
dependency was deleted. No gate was weakened. No completion criterion
was broadened. No fixture scope changed. No product spec was edited.

## Forbidden-Action Audit

| Forbidden action | Found in at-ctrl-008 diff? |
|---|---|
| weakening gates | No (no gate was touched) |
| deleting dependencies | No (no DAG row, dependency, or join-table row was deleted) |
| broadening completion criteria | No (the rule only restricts dispatch; it does not relax completion) |
| relaxing product-spec immutability | No (no product spec was edited) |
| adding compatibility aliases for removed commands | No |
| broadening fixture scope without matrix-backed reason | No (no fixture was added) |
| narrowing expected diff shape to hide required work | No (the diff is a routing rule, not a diff-shape change) |
| downgrading blocker severity without evidence | No (no blocker was touched) |
| converting executable requirements into assumptions | No (the new rule is a routing constraint, not an assumption) |
| allowing pending commands to satisfy phase gates | No |

All ten forbidden actions: clear.

## Product-Spec Immutability Audit

```text
$ git diff --name-status -- harness/knowledge/product-specs/atelier
(empty)
$ git diff --cached --name-status -- harness/knowledge/product-specs/atelier
(empty)
$ git status --porcelain=v1 -- harness/knowledge/product-specs/atelier
(empty)
```

No product spec was edited.

## Check Run Audit

```text
$ bun nx run atelier:check
typecheck + 122 tests pass, 0 failures
```

The change is doc-only; no source, test, fixture, or coverage file was
touched, so the existing check and test runs remain green.

## Why this is a control-doc-repair packet (not an implementation packet)

- All three modified files
  (`IMPLEMENTATION_DAG.md`, `SUBAGENT_ROLE_CATALOG.md`,
  `IMPLEMENTATION_LEDGER.md`) are in the implementation-control layer.
  The first two are listed in `immutable_control_doc_roots`, and the
  third is listed in `mutable_state_roots`. Editing the immutable ones
  is the explicit role of the `control-doc-repair` packet type.
- The new rule is a routing constraint for packet dispatch; it does
  not implement, generate, fixture, test, or accept any product
  behavior.
- `product_code_packets_allowed: false` is unchanged.
- The launch state (`launch_status: unsafe`) is unchanged.
- `BLK-TRACEABILITY-001` is the only remaining phase blocker and is
  unchanged.

## Why the rule is necessary

`IMPLEMENTATION_DAG.md` is a sequencing graph, not a packet
assignment. Its rows express dependency ranges that are convenient
for human readers (e.g. `DAG-21_to_DAG-25` covers the five Stage 0
adapter-portability nodes). Without an explicit rule, a dispatcher
that mechanically reads the Node ID column could interpret
`DAG-21_to_DAG-25` as a single five-node packet and dispatch one
subagent to "implement the range" — violating the per-role canonical
split rules in `SUBAGENT_ROLE_CATALOG.md` and the patch-boundary
requirement in `AGENT_PACKET_PROTOCOL.md` that packets must name a
narrow subset of invariant IDs, exact spec sections, allowed files,
and validation gates.

The new rule makes the dispatch contract explicit at both ends:
- on the DAG page, before the table;
- on the role catalog page, next to the canonical splits.

The cross-reference is bidirectional: the role catalog points to the
DAG rule, and the DAG rule points to the role catalog's canonical
splits.
