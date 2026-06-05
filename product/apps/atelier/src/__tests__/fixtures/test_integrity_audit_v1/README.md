# Fixture: test_integrity_audit_v1

Executable v5.1 fixture for test integrity and no-weakening audit.

## Layout

This directory follows the v5.1 fixture layout from
`CONTRACT_TEST_MATRIX.md` §1a:

- `input.ts` - audited files, forbidden patterns, and required guard text
- `expected.ts` - zero-weakening expectations
- `README.md` — this file
- `command.ts` - VG-038 audit command

## Status

The alias registry records `status: executable` for this row. The command
fails closed when relevant tests are skipped/focused, the DAG-02 fixtures
remain placeholders, or the packet loses required coverage guard text.

## Provenance

See the registry row for `test_integrity_audit_v1` in
`harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-2026-06-04.yaml`
for the assigned DAG node, gate, and source spec section.
