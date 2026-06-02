---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952.review
title: "RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952 Review"
status: active
summary: "Review report for atelier nix packaging run"
tags:
  - harness
  - run
  - review
---

# Review Report

## Scope Reviewed

- Diff:
  - `flake.nix` — adds `atelier` package + app + check next to `castalia`,
    updates inline comment from castalia-specific to `product/apps/<name>`.
  - `product/apps/atelier/nix/package.nix` — new `stdenvNoCC.mkDerivation`
    using `bun build --compile`.
  - `product/apps/atelier/flake.nix` — new subflake mirroring castalia's
    subflake shape; pinned to `nixpkgs/release-26.05`.
- Run artifacts: `brief.md`, `context.md`, `context.manifest.json`,
  `worklog.md`, `verification.md`, `handoff.md`, this `review.md`.
- Validation evidence: `verification.md` — `nix build .#atelier`,
  subflake build, `nix flake check`, and `bun nx run atelier:check` all
  pass.
- Assigned roles: `role.domain.repo-ops-engineer`.
- Required role knowledge: nx, repo-map, repository policy, git/nx/linter
  guardrails, docs-linter spec — all checked, no contradictions.

## Findings

| Severity | Location | Finding | Required action |
| --- | --- | --- | --- |
| info | `flake.nix` apps.* | App outputs lack `meta`; `nix flake check` warns. Same pattern as the existing `apps.castalia`. | None for this run; track as follow-up. |
| info | `harness/knowledge/specs/docs/docs-rename.md:32` | Doctor reports a `BROKEN_MARKDOWN_LINK` against a literal markdown-link example embedded in prose. Pre-existing and unrelated to this run. | Out of scope; track separately. |

## Requirement Check

- Acceptance criteria satisfied: yes — atelier installable via `nix build .#atelier`
  and runnable via `nix run .#atelier --`, mirroring castalia's surface.
- Scope respected: yes — only nix packaging files plus the root flake wiring
  were modified. No source code, no tests, no other apps touched.
- Role constraints respected: yes — repo-ops domain (workspace automation,
  Nix) is the natural owner.
- Boundary rules respected: yes — no cross-package leakage; subflake stays
  inside `product/apps/atelier/`.
- Public API impact documented: yes — new public surface
  (`packages.atelier`, `apps.atelier`, `checks.atelier`) recorded in
  `handoff.md`.
- Verification adequate: yes — both root and subflake builds executed,
  binary smoke-tested, atelier unit suite green.
- Handoff adequate: yes — what/why/affected files/validation/risks/
  follow-ups all present.

## Residual Risk

- Binary size (~100 MB) inherent to `bun build --compile`. Acceptable for
  a local control-plane CLI distributed via nix store.
- Subflake is pinned to `release-26.05` while the root is on
  `nixos-unstable`; this is consistent with castalia and intentional
  (consumers get stability; monorepo gets latest).

## Recommendation

Approve. Change is mechanical, evidence-backed, and consistent with the
established castalia precedent.
