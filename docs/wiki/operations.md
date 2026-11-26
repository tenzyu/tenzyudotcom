---
type: Playbook
title: Operations and verification
description: Safe test and preview boundaries, past incidents and CI acceptance.
tags: [operations, security, ci, neko7]
status: stable
sources:
  - { resource: ../../.github/workflows/ci.yml, title: CI definition }
  - { resource: ../../repo-ops/operations/README.md, title: Observation and browser tools }
  - { resource: "https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal/neko7-opencode-baseline-2026-11-02.md", title: Dated OpenCode/preview baseline }
---

# Repository verification and operational hazards

If nix-direnv has already loaded the shell, run project commands directly. Otherwise, run `nix develop` once. Run checks for the changed projects first. Then run `bun nx affected -t check --base=origin/develop --head=HEAD`. Run a build when relevant. CI runs a frozen root Bun install, the catalog-derived dependency policy, checks and builds for affected projects, and Rust Cargo checks. A pull request passes CI only when its checks complete successfully.

`repo-ops/evidence/run.mjs` controls environment inheritance and records exit codes, timeouts and hashes. It does not isolate the network or filesystem. Keep evidence outside Git. Nx and Next may read dotenv files automatically. Use credential-free copies for exploration.

The public Playwright suite tests desktop and mobile Chromium on port 4173. The editor suite uses an in-memory GitHub fixture on port 4174. Both suites use `.next`. Run only one suite at a time. Passing tests against the GitHub fixture does not authorize live writes. See [tool manual](../../repo-ops/operations/README.md).

## Historical incidents

- On 2026-11-02, the number of PostCSS workers and zombie processes increased during a Next preview. The cause was unconfirmed. A separate isolated preview returned HTTP 500 due to missing `critters`, not proof of safe production readiness.
- A host snapshot found two OpenCode servers accessing the same DB/WAL. Do not stop or reconfigure either based on the historical snapshot. Check current units, persistence and backups first.
- Tailscale Serve and Storybook were previously accessible only over the tailnet. Historical URLs, port numbers and unit states do not establish current availability.
- The candidate-state prototype was retired. Its records contained unauthenticated operator assertions. They did not establish approval or exactly-once execution. The original source remains in Git history.

No live system, production deployment, or CI job has been verified by this documentation rewrite.
