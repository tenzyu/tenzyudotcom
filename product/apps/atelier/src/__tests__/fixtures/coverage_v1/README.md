# Fixture: coverage_v1

Executable v5.1 fixture for contract coverage.

## Layout

This directory follows the v5.1 fixture layout from
`CONTRACT_TEST_MATRIX.md` §1a:

- `input.ts` - canonical assertion, DAG, gate, and fixture paths
- `expected.ts` - zero-gap coverage expectations
- `README.md` — this file
- `command.ts` - coverage validator used by VG-029

## Status

The alias registry records `status: executable` for this row. The command
fails closed when an executable normative assertion has no concrete link, any
link points at `legacy_unresolved`, or a referenced DAG node, gate, fixture, or
assertion is missing from canonical state.

## Provenance

See the registry row for `coverage_v1` in
`harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml`
for the assigned DAG node, gate, and source spec section.
