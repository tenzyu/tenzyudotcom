# Atelier Implementation-Control State

This directory is mutable implementation-control state. Product specs are immutable and never live here.

## Mutable Roots

- `state/packets/**`
- `state/blockers/**`
- `state/assumptions/**`
- `state/validations/**`
- `state/handoffs/**`
- `state/waivers/**`
- `state/repository-inventory/**`
- `state/command-discovery/**`
- `state/gates/**`
- `state/traceability/**`

## State Directory Aliases

The user-prescribed plan referenced two directory names that diverge from the existing paths. The decision is to preserve the existing paths to avoid breaking references in packets, validations, and the ledger.

```yaml
state_directory_aliases:
  validation: state/validations
  repo_inventory: state/repository-inventory
decision: preserve_existing_paths
reason: avoid breaking existing packet, validation, and ledger references
```

A fresh agent that finds a reference to `state/validation` (singular) or `state/repo-inventory` (no `repository` segment) in a plan or spec should resolve it to the actual path. References in implementation-control state files and packets use the actual paths.

## Immutable Core Docs

Ordinary packets must not edit these files:

- `../IMPLEMENTATION_ORCHESTRATOR.md`
- `../SPEC_READ_PLAN.md`
- `../CONTRACT_TO_BUILD_MATRIX.md`
- `../IMPLEMENTATION_DAG.md`
- `../AGENT_PACKET_PROTOCOL.md`
- `../SUBAGENT_ROLE_CATALOG.md`
- `../VALIDATION_GATE_REGISTRY.md`
- `../SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md`
- `../FULL_COMPLETION_DEFINITION.md`
- `../REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md`

`../IMPLEMENTATION_LEDGER.md` is mutable ledger state. Core docs may be changed only by a dedicated `control-doc-repair` packet and must be re-baselined with VG-037.
