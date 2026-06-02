---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952.worklog
title: "RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952 Worklog"
status: active
summary: "Worklog for packaging atelier as a Nix derivation"
tags:
  - harness
  - run
  - worklog
---

# Worklog

## Investigation

- Read `product/apps/atelier/README.md`, `product/apps/atelier/package.json`,
  `product/apps/atelier/project.json` to understand build entry points.
- Confirmed `src/cli.ts` declares `#!/usr/bin/env bun`, uses only relative imports
  and `node:*` builtins (no npm runtime deps), and uses Bun-specific APIs
  (`Bun.YAML`, `import.meta.main`).
- Inspected castalia's packaging pattern: subflake at `product/apps/castalia/flake.nix`,
  `nix/package.nix` consumed by both the subflake and root `flake.nix` via
  `pkgs.callPackage`.
- Compared current root `flake.nix` exposure: `packages.castalia`, `apps.castalia`,
  and `checks.castalia` — mirror this shape for atelier.

## Approach decision

Two options were considered:

1. `bun build` to JS bundle + wrapper that invokes `bun` at runtime
   (requires bun in user env).
2. `bun build --compile` to produce a self-contained executable
   (no runtime dependency, single binary like castalia).

Chose option 2 because it matches castalia's "single binary in `$out/bin`" shape
and removes any runtime bun requirement for downstream consumers.

## Build feasibility check

Verified locally outside the nix sandbox first:

```bash
cp -r product/apps/atelier/src /tmp/atelier-test/
cd /tmp/atelier-test
bun build --compile --minify ./src/cli.ts --outfile atelier
./atelier --help
```

Result: produced a `~100 MB` self-contained ELF executable that printed the
expected usage banner. No network access required; all imports are local or
`node:*` builtins shipped with the bun runtime.

## Implementation

- Added `product/apps/atelier/nix/package.nix` — `stdenvNoCC.mkDerivation` that
  takes a cleaned source (excluding `node_modules`, `dist`, `nix`),
  runs `bun build --compile --minify ./src/cli.ts --outfile atelier`,
  and installs the binary to `$out/bin/atelier` with mode 0755.
- Added `product/apps/atelier/flake.nix` — subflake mirroring
  `product/apps/castalia/flake.nix`. Pinned to `nixpkgs/release-26.05` for
  consumer stability, exposes `packages.{default,atelier}`,
  `apps.{default,atelier}`, and `checks.atelier` across linux + darwin systems.
- Updated root `flake.nix` to add `atelier = pkgs.callPackage ./product/apps/atelier/nix/package.nix { }`
  and surface it in `packages`, `apps`, and `checks` next to `castalia`.
  Updated the leading comment to read `product/apps/<name>` instead of the
  castalia-specific path.

## Verification iterations

- First `nix build .#atelier` failed because the new files were untracked by git
  and therefore invisible to the flake. Resolved with `git add -N` on the new
  paths. (Recorded for follow-up: standard nix flake gotcha.)
- Subsequent `nix build .#atelier` and `nix build ./product/apps/atelier#atelier`
  both succeeded; binary runs and prints the help banner.
- `bun nx run atelier:check` passes: typecheck OK, 24 tests pass.
- `nix flake check --no-build` reports `all checks passed`. The single warning
  (`apps.x86_64-linux.atelier lacks attribute 'meta'`) mirrors castalia's
  existing root-flake shape and is not a failure.

## Follow-ups recorded

- Decide whether root-flake app outputs should grow a `meta` attribute (would
  also benefit the existing castalia app entry). Not in scope for this run.
