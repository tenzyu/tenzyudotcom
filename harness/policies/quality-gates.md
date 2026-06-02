---
schema: harness/v1
kind: policy
id: policy.quality-gates
title: Quality Gates
status: active
summary: Defines validation gates selected by affected scope.
tags:
  - policy
  - quality
  - verification
---

# Quality Gates

Quality gates are selected by the affected scope. Passing a broad command is not
enough by itself; agents must explain which requirement each check covers.

## Baseline Gates

For every non-trivial change:

- Keep the change inside the approved task scope.
- Run the narrowest relevant Nx validation where possible.
- Record commands, results, skipped checks, and failures in `verification.md`.
- Complete `handoff.md` before claiming the task is ready.
- Document public API changes and migration notes.
- Separate remaining risks from completed work.

## Standard Commands

Use Nx through Bun from the repository root.

```bash
bun nx run <project>:<target>
bun nx run-many -t <target>
bun nx affected -t <target>
```

Broad handoff checks for broad changes:

```bash
bun run policy:deps
bun nx run-many -t check
```

If Nx fails before running a task, record the exact failure and use the closest
visible project or package scripts only as a fallback.

## Scope-Specific Gates

### TypeScript or Runtime Code

- Relevant `typecheck` passes.
- Relevant `test` passes when tests exist.
- Relevant `build` passes when runtime or package output is affected.
- No package boundary violations are introduced.

### Shared UI

- `@tenzyu/ui` typecheck and tests pass.
- Storybook coverage exists for affected components.
- Components render without app-local CSS patches.
- Variants and states are visually distinguishable where relevant.
- Accessibility expectations are considered and documented.
- Public component API changes include migration notes.

### Web App

- Relevant `web` build or check passes.
- Route behavior is preserved.
- Shared UI is consumed through approved package APIs.
- Web route-local code does not become an unauthorized shared dependency.

### Workbench App and Tauri

- Relevant frontend checks pass.
- Rust/Tauri checks run when native code is affected.
- Native filesystem and shell capabilities remain isolated behind explicit interfaces.

### Repo Ops, Nx, Bun, Nix, and CI

- Affected graph implications are documented.
- Root scripts remain coherent.
- Cache behavior is not accidentally disabled.
- Local versus CI assumptions are documented when known.
- Nix-specific assumptions are explicit.

### Documentation-Only Changes

- Required files exist and point to the canonical source of truth.
- Links and file names match the current tree.
- No runtime source, package manager, or build script changes are introduced.
- Uncertain areas are marked as `TODO` or `Assumption`.

## Completion Rule

Do not claim completion only because tests passed. Completion requires all
acceptance criteria, file deliverables, verification notes, handoff notes, and
scope restrictions to be satisfied.
