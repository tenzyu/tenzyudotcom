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

# Tests

If nix-direnv has already loaded the shell, run project commands directly. Otherwise enter `nix develop` once. Focus on changed project checks, then `bun nx affected -t check --base=origin/develop --head=HEAD` and build when relevant. CI runs a frozen root Bun install, the catalog-derived dependency policy, checks and builds for affected projects, and Rust Cargo checks. A pull request passes CI only when its checks complete successfully.

`repo-ops/evidence/run.mjs` controls environment inheritance and records exit codes, timeouts and hashes. It does not isolate the network or filesystem. Keep evidence outside Git. Nx and Next may read dotenv files automatically. Use credential-free copies for exploration.

Public Playwright suite runs Chromium desktop/mobile on port 4173. Editor suite uses an in-memory GitHub fixture on 4174. Both suites use `.next`. Never run them concurrently. Passing tests against the GitHub fixture does not authorize live writes. See [tool manual](../../repo-ops/operations/README.md).

# Dated hazards (revalidate before action)

- On 2026-11-02, the number of PostCSS workers and zombie processes increased during a Next preview. The cause was unconfirmed. A separate isolated preview returned HTTP 500 due to missing `critters`, not proof of safe production readiness.
- A host snapshot found two OpenCode servers accessing the same DB/WAL. Do not stop or reconfigure either based on the historical snapshot. Check current units, persistence and backups first.
- Tailscale Serve and Storybook were previously accessible only over the tailnet. Historical URLs, port numbers and unit states do not establish current availability.
- The candidate-state prototype was retired. Its records contained unauthenticated operator assertions. They did not establish approval or exactly-once execution. The original source remains in Git history.

No live system, production deployment, or CI job has been verified by this documentation rewrite.
