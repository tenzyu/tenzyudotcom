---
type: Playbook
title: Operations and verification
description: Safe test and preview boundaries, past incidents and CI acceptance.
tags: [operations, security, ci, neko7]
status: stable
sources:
  - { resource: ../../.github/workflows/ci.yml, title: CI definition }
  - { resource: ../../repo-ops/renewal/README.md, title: Observation and browser tools }
  - { resource: "https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal/neko7-opencode-baseline-2026-11-02.md", title: Dated OpenCode/preview baseline }
---

# Tests

In an already entered nix-direnv shell run project commands directly. Otherwise enter `nix develop` once. Focus on changed project checks, then `bun nx affected -t check --base=origin/develop --head=HEAD` and build when relevant. CI defines Bun install, dependency policy, affected check/build and Rust cargo checks; a PR is only green once **actual** checks complete.

`repo-ops/renewal/run.mjs` controls environment inheritance and records exit codes/timeouts/hash, but does **not** isolate network or filesystem. Keep evidence outside Git. Nx/Next may read dotenv automatically: use credential-free copies for exploration.

Public Playwright suite runs Chromium desktop/mobile on port 4173. Editor suite uses an in-memory GitHub fixture on 4174. They share `.next`: **never run concurrently**. Fake GitHub success is not live write authorization. See [tool manual](../../repo-ops/renewal/README.md).

# Dated hazards (revalidate before action)

- On 2026-11-02 a Next preview grew PostCSS worker/zombie counts; root cause was **unconfirmed**. A separate isolated preview returned HTTP 500 due to missing `critters`, not proof of safe production readiness.
- A host snapshot found two OpenCode servers accessing the same DB/WAL. Do **not** stop/reconfigure either based on history; check present units, persistence and backups first.
- Tailscale Serve/Storybook were historically tailnet-only; old URLs, port numbers and unit states are **not** live availability claims.
- The candidate-state prototype records operator assertions but does not authenticate approval or guarantee durable exactly-once execution. Never attach automatic external side effects without additional design and verification.

No live system, production deployment, or CI job has been verified by this documentation rewrite.
