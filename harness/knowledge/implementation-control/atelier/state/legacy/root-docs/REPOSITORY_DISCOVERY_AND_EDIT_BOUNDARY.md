---
schema: harness/v1
kind: knowledge
id: knowledge.implementation-control.atelier-repository-discovery-edit-boundary
title: Atelier Repository Discovery And Edit Boundary
status: active
tags:
  - product:atelier
  - subject:implementation-control
  - layer:implementation
---

# Atelier Repository Discovery And Edit Boundary

## Purpose

This document defines the required repository inventory before any implementation subagent edits source, tests, fixtures, generated state, or durable evidence. Product specs define product truth. This document only derives implementation edit boundaries from the repository as it exists at launch.

## Launch Baseline Rule

Product-spec immutability baseline is `HEAD` product-spec contents unless a separate, explicit product-spec governance process has already authorized and committed a new product-spec revision. Current filesystem contents under `harness/knowledge/product-specs/atelier` are never accepted as the immutable baseline when they differ from `HEAD`.

If product-spec files are staged, unstaged, untracked, renamed, deleted, mode-changed, or hash-different from the recorded `HEAD` baseline, implementation subagent dispatch is forbidden. The mother agent may continue control-doc repair only.

## Required Inventory Schema

Record this inventory in `state/repository-inventory/repo-inventory-<date>.md` and reference it from `IMPLEMENTATION_LEDGER.md` before dispatching implementation packets:

```yaml
repository_inventory:
  inventory_id: <id>
  recorded_at: <RFC3339>
  baseline_revision: <git rev-parse HEAD>
  package_manager: <bun|npm|pnpm|yarn|unknown>
  workspace_system: <nx|turbo|workspaces|build-tool|unknown>
  projects:
    - id: <project id>
      root: <repo-relative path>
      source_roots:
        - <path>
      test_roots:
        - <path>
      fixture_roots:
        - <path>
      generated_roots:
        - <path>
      commands:
        typecheck: <exact command or unresolved>
        test: <exact command or unresolved>
        check: <exact command or unresolved>
        lint: <exact command or unresolved>
  atelier_modules:
    - path: <path>
      detected_role: <role from SUBAGENT_ROLE_CATALOG.md>
      existing_interfaces:
        - <symbol or path>
  git_state:
    status_porcelain: <full git status --porcelain output or summary>
    staged_files: []
    unstaged_files: []
    untracked_files: []
  editable_roots:
    source: []
    tests: []
    fixtures: []
    generated: []
  forbidden_roots:
    - harness/knowledge/product-specs/atelier/**
    - <immutable implementation-control doc paths>
    - <unrelated repository files>
  fixture_alias_registry_ref: <repo-relative path to the fixture alias registry>
```

## Inventory Validity Criteria

A `repo_inventory_ref` is valid only when:

- `package_manager` is one of `bun | npm | pnpm | yarn` (or `unknown` with explicit non-Nx fallback recorded);
- `workspace_system` is one of `nx | turbo | workspaces | build-tool` (or `unknown` with explicit non-Nx fallback recorded);
- `atelier_modules` is non-empty and every entry has `detected_role` and at least one `existing_interfaces` entry (or `unresolved` with reason);
- `editable_roots.source`, `editable_roots.tests`, `editable_roots.fixtures`, `editable_roots.generated` are all present (each may be empty for a control-only project, but the field must exist);
- `forbidden_roots` includes `harness/knowledge/product-specs/atelier/**` and all immutable implementation-control core docs;
- `git_state.untracked_files` is recorded (the only allowed untracked files under implementation-control are part of an in-progress control-doc-repair);
- `product_spec_drift_status` is `clean` and references the current VG-001 / VG-036 proof;
- `commands.check` resolves to a `command_discovery_ref` recorded in `state/command-discovery/**`;
- `fixture_alias_registry_ref` is recorded and references a parseable fixture alias registry YAML (per `state/traceability/fixture-alias-registry-<date>.yaml`). For fixture/code packets whose `allowed_files_ref` names a fixture ID, the registry must include that ID with a non-empty `command_file`.

## Discovery Commands

Minimum command discovery:

- `git rev-parse HEAD`
- `git status --porcelain=v1`
- `git status --porcelain=v1 -- harness/knowledge/product-specs/atelier`
- `git diff --name-status -- harness/knowledge/product-specs/atelier`
- `git diff --cached --name-status -- harness/knowledge/product-specs/atelier`
- `git diff --name-status HEAD -- harness/knowledge/product-specs/atelier`
- package-manager detection from `packageManager` in root `package.json`, lockfiles, and workspace metadata;
- Nx detection from `nx.json`, root/package dependencies, and package scripts;
- package-manager-appropriate Nx project discovery;
- package-manager-appropriate Nx target discovery after the Atelier project is identified;
- non-Nx equivalent target discovery from root/project `package.json` scripts, workspace config, and build-tool metadata when Nx is absent.

Package-manager-specific Nx discovery order:

1. If root `packageManager` starts with `bun` or `bun.lock` exists, try `bun nx show projects` and `bun nx show project <project>`.
2. If `pnpm-lock.yaml` exists or root `packageManager` starts with `pnpm`, try `pnpm nx show projects` and `pnpm nx show project <project>`.
3. If `yarn.lock` exists or root `packageManager` starts with `yarn`, try `yarn nx show projects` and `yarn nx show project <project>`.
4. If `package-lock.json` exists or root `packageManager` starts with `npm`, try `npx nx show projects` and `npx nx show project <project>`.
5. If Nx metadata is absent or all Nx commands are unavailable, discover equivalent targets from root scripts, project scripts, workspace package paths, and build-tool config. Record the source of each target.

When a command is unavailable, record `tool_unavailable` with the exact command. Do not infer project or target absence until all package-manager alternatives and non-Nx fallback paths have been checked.

## Proof Artifact Paths

Repository inventory and command discovery proof artifacts live under:

- `harness/knowledge/implementation-control/atelier/state/repository-inventory/**`;
- `harness/knowledge/implementation-control/atelier/state/command-discovery/**`;
- `harness/knowledge/implementation-control/atelier/state/validations/**`.

## Editable Root Derivation

Allowed files in packets must be derived from discovered roots, not invented examples. A packet may name an explicit file or a narrow glob only when the inventory proves that root exists and the packet owns the matching invariant.

Ordinary implementation packets may edit:

- discovered Atelier source roots assigned by invariant ID;
- discovered test roots assigned by invariant ID;
- discovered fixture roots assigned by fixture ID;
- `IMPLEMENTATION_LEDGER.md`;
- packet, blocker, assumption, validation, handoff, waiver, repository-inventory, command-discovery, gate, and traceability records under exact mutable implementation-control `state/**` directories, including the fixture alias registry state path `harness/knowledge/implementation-control/atelier/state/traceability/fixture-alias-registry-<date>.yaml` when the packet updates an existing row to mark a fixture executable or pending;
- generated roots only when the packet states the generated-state policy.

Ordinary implementation packets must not edit:

- `harness/knowledge/product-specs/atelier/**`;
- immutable implementation-control core docs;
- unrelated source, test, fixture, or package files outside the assigned boundary;
- durable evidence unless the packet is explicitly authorized to create, supersede, reject, or accept evidence through the product contract;
- `.atelier/**` outside an authorized derived-state fixture or command.

## Dirty Worktree Handling

The mother agent records unrelated dirty files before dispatch. It must not revert, normalize, or incorporate unrelated changes. If dirty files overlap the packet boundary, the packet is blocked until the user resolves the conflict or explicitly assigns that boundary.

Product-spec drift is special: it is always a P0 launch blocker for implementation dispatch. The only allowed resolutions are restoring product specs to `HEAD`, or completing and committing an authorized product-spec governance revision before implementation launch.

## Packet Boundary Rules

A packet is dispatchable only when:

- product spec baseline hashes are recorded from `HEAD`;
- product spec staged, unstaged, status, and hash checks pass;
- immutable control-doc baseline is recorded;
- repository inventory exists and satisfies `inventory_validity_criteria` above;
- allowed files are explicit and derived from inventory;
- required product spec sections, invariant IDs, DAG node IDs, and validation gate IDs are present;
- pending validation commands are allowed only because the packet is a scaffold/oracle packet, not because implementation behavior is accepted.

## Hard Prerequisites

No implementation, fixture, test, adapter, CLI, or generated-state packet may be dispatched until both `DAG-01B` (Repository implementation inventory) and `DAG-01C` (Command and target discovery) pass.

`DAG-10` (Write authority enforcement) is not dispatchable until `DAG-04` (Graph schema/identity) and `DAG-05` (Event model) pass.
