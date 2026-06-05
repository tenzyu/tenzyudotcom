<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Implementation DAG

| DAG node | Phase | Owner | Required gates | Allowed files |
| --- | --- | --- | --- | --- |
| DAG-00 | PG-0 | mother agent | VG-001, VG-037 | state/README.md mutable roots only |
| DAG-01 | PG-0 | contract auditor | VG-001, VG-036 | state/validations/VG-001-product-spec-clean-2026-06-04.md and VG-036-product-spec-hash-2026-06-04.md |
| DAG-01B | PG-0B | contract auditor | VG-000, VG-001, VG-036, VG-037 | state/repository-inventory/repo-inventory-2026-06-04.md |
| DAG-01C | PG-0B | contract auditor | VG-000, VG-002 | state/command-discovery/command-discovery-2026-06-04.md |
| DAG-02 | PG-1 and PG-F | contract auditor | VG-029, VG-038 | state/traceability/** only during repair |
| DAG-02A | PG-1 and PG-F | fixture author | VG-004, VG-045 | state/traceability/** and future fixture alias state only |
| DAG-04 | PG-1 | graph kernel implementer | VG-005, VG-006, VG-034, VG-038 | product/apps/atelier/src/core/graph.ts |
| DAG-05 | PG-1 | event lifecycle implementer | VG-011, VG-013, VG-040, VG-041, VG-044 | product/apps/atelier/src/core/events.ts |
| DAG-06 | PG-1 | verification engine implementer | VG-008, VG-009, VG-010, VG-024, VG-042, VG-043 | product/apps/atelier/src/core/contract.ts |
| DAG-07 | PG-1 | surface/CLI implementer | VG-018, VG-019, VG-039 | product/apps/atelier/src/cli.ts, product/apps/atelier/src/mcp.ts, product/apps/atelier/src/gui/** |
| DAG-08 | PG-1 | adapter implementer | VG-021, VG-022, VG-023, VG-032 | product/apps/atelier/src/adapter/** |
| DAG-09 | PG-1 | event lifecycle implementer | VG-020, VG-033 | product/apps/atelier/src/core/runs.ts |
| DAG-10 | PG-1 | governance/policy boundary implementer | VG-015, VG-025, VG-026A, VG-026B, VG-043, VG-034 | product/apps/atelier/src/core/policy.ts |
