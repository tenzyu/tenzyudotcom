---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952.verification
title: "RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952 Verification"
status: active
summary: "Verification evidence for atelier nix packaging"
tags:
  - harness
  - run
  - verification
---

# Verification

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `nix build .#atelier --print-build-logs --no-link` | ok | derivation `nlnazyymfykry...-atelier-0.1.0.drv`; bun --compile produced `$out/bin/atelier` |
| `/nix/store/.../atelier-0.1.0/bin/atelier --help` | ok | prints full usage banner |
| `nix run .#atelier -- doctor --json --project-root .` | ok | doctor JSON emitted; harness reports `ok: false` (pre-existing doctor diagnostics, unrelated to packaging) |
| `nix build ./product/apps/atelier#atelier --print-build-logs --no-link` | ok | subflake builds via `release-26.05` nixpkgs |
| `nix flake check --no-build` | ok | `all checks passed`; one non-fatal `apps.* lacks 'meta'` warning matching existing castalia shape |
| `bun nx run atelier:check` | ok | tsc --noEmit clean; 24 tests pass / 0 fail / 120 expects |

## Files Inspected

- `product/apps/atelier/README.md`
- `product/apps/atelier/package.json`
- `product/apps/atelier/project.json`
- `product/apps/atelier/src/cli.ts`
- `product/apps/atelier/src/index.ts`
- `product/apps/atelier/src/core/frontmatter.ts` (for Bun.YAML usage)
- `product/apps/castalia/flake.nix`
- `product/apps/castalia/nix/package.nix`
- `flake.nix`
- `nix/packages.nix`
- `harness/actions/workflows/isolated-run.md`

## Role Knowledge Checked

- Required: `knowledge.monorepo.nx`, `knowledge.repo-map`, `policy.repository`,
  `policy.tool.git`, `policy.tool.nx`, `policy.tool.tenzyu-linter`,
  `knowledge.spec.docs.linter`.
- Optional: not expanded — neither `docs-agents-md-generator` nor `docs-rename`
  matched this packaging task once concrete files were identified.
- Skipped knowledge with reason: completed-run history skipped per default
  context policy; `policies/context-budget.md` did not match.

## Visual Checks

Not applicable. CLI-only binary.

## Tests

- Added: none. Existing atelier suite (`__tests__/*.test.ts`) exercises the
  same `src/*` entry points that nix compiles.
- Existing coverage used: 24 tests across 4 files; passed against the source
  tree that `bun build --compile` consumes.
- Nix-level test: derivation appears in `checks.x86_64-linux.atelier`, so
  `nix flake check` enforces a successful rebuild.

## Skipped Checks

- `bun run policy:deps` — not run. Change is scoped to nix packaging and does
  not touch TS/JS dependency boundaries (no `package.json`/import edits).
- `bun nx run-many -t check` — not run. Touched files are limited to atelier
  and root flake; affected graph for TS is empty.

## Failures

- None blocking. The `nix flake check` warning about apps missing `meta`
  predates this run (it also applies to the root `apps.castalia` entry).

## Conclusion

Verified. Atelier is reproducibly buildable as a Nix derivation through both
the root flake (`.#atelier`) and the per-app subflake
(`./product/apps/atelier#atelier`), and the resulting `$out/bin/atelier`
executable behaves identically to the bun-driven CLI.
