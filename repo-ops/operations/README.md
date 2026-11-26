# Repository operations

Acceptance and fixture tools live in `repo-ops/acceptance`, evidence in `repo-ops/evidence`, recovery in `repo-ops/recovery`, preview in `repo-ops/preview`, and dependency policy in `repo-ops/policy`. Root package commands delegate browser dependency builds to Nx and use a Linux checkout lease (`flock`). Direct script paths have moved as shown below.

Node 22+; use only a credential-free evaluation copy. **These tools are not an OS sandbox and do not authorize deletion or publication.** Logs, backups and browser traces belong in fresh, private locations outside Git.

## Inventory, command recording and preservation

```sh
node repo-ops/recovery/inventory.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_JSON"
node repo-ops/recovery/catalog.mjs "$NEW_EXTERNAL_JSON" "$NEW_EXTERNAL_CSV"
node repo-ops/evidence/run.mjs --cwd "$EVALUATION_REPO" --out "$NEW_EXTERNAL_RESULT_DIR" --timeout 120 -- bun test ./product/apps/web/src
node repo-ops/recovery/verify-restore.mjs "$TAR" "$RESTORED_PARENT" "$NEW_PRIVATE_REPORT"
node repo-ops/recovery/verify-source.mjs "$INVENTORY" "$RESTORED_REPO" "$NEW_PRIVATE_REPORT"
node repo-ops/recovery/preserve-worktrees.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_DIRECTORY"
```

Inventory inspects paths, Git state, symlinks, manifest files and size; CSV classifications are proposals, never deletion permission. Runner records exit code, time, timeout and SHA-256 and limits inherited environment, but HOME remains available and network/filesystem isolation is **not** enforced. It rejects overwriting evidence. Do not pass secrets on the command line.

Check tar membership and hash; extract with `tar -xpf` into a new private parent, never the original worktree. Restore verification distinguishes group mismatch; source verification does not attest ignored/new files. Worktree preservation records statuses, tar archives and verified Git bundle; it does not delete anything. Stop writers before preservation.

## Read-only local preview

On NixOS with a user systemd manager, from the repository root in the appropriate already-loaded devShell:

```sh
bash repo-ops/preview/readonly-preview.sh start
bash repo-ops/preview/readonly-preview.sh status
bash repo-ops/preview/readonly-preview.sh stop
```

This copies committed `HEAD` into a fresh snapshot under `/tmp/opencode`, builds UI and serves loopback `127.0.0.1:43192` for at most one hour. It rejects editor writes/server actions and most WebSocket traffic and is not exposed to Tailscale. It has resource/filesystem constraints, **not arbitrary untrusted-code isolation**. Commit intended changes first; preserve logs privately.

## CI evidence and browser checks

The opt-in evidence workflow records the Git commit and tree, lockfile/config digests and toolchain versions for each artifact. Audit reports distinguish a valid empty response from a failed scanner; an advisory observation is not a vulnerability-free attestation. The workspace utility gate runs the path/runner, editor preload, preview gate and sanitizer tests.

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun run test:browser
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun --no-env-file run test:browser:editor
node --test repo-ops/acceptance/editor-github-preload.test.mjs
node --test repo-ops/evidence/run.test.mjs
```

If necessary, enter `nix develop .#browser-verification` once. Public acceptance uses Playwright/Chromium 1440/390 px, server at port 4173, credential-free and read-only external public content. Editor acceptance uses port 4174, dummy credentials and a synthetic bare Git repository behind a fake GitHub transport that refuses external fetch; fixture writes do **not** reach GitHub. Each root browser command creates a unique evidence subdirectory and acquires a nonblocking checkout lease. It refuses overlap with another root browser command; direct Next/Nx commands do not participate in that lease. Evidence contains `results.json`, server log, event attachments and traces; never commit it. The live-content suite remains Chromium-only. The separate deterministic public fixture uses all three Playwright engines, desktop and narrow viewports, port 4175, and a synthetic Git seed. It is opt-in via `bun --no-env-file run test:browser:fixture` or the evidence workflow. Publication acceptance archives an exact committed candidate (or explicit historical control); untracked or dirty working-tree files are never copied. Commit intended changes before running it. The normal publication CI uploads fixture evidence (including checkout provenance); the opt-in workflow no longer repeats those same suites. Use a separate checkout for other concurrent builds.

See the [Web verification skill](../../product/apps/web/.claude/skills/verify/SKILL.md) and [OKF operations notes](../../docs/wiki/operations.md).

## Retired renewal utilities

The candidate-state simulation, old preview probe (which targeted retired routes), host-specific OpenCode pairing helper, and one-off notes publication helper are no longer active tooling. Their original source and tests are preserved at [the pre-retirement commit](https://github.com/tenzyu/tenzyudotcom/tree/03d8ecd60828640836a3044d19fb0236ce157cb7/repo-ops/renewal). Use the retained browser suites for verification and the current infrastructure repository for host operations. This retirement does not remove any local data or change a running service.

Editor mutations now require the canonical `SITE_URL` origin in production, or a server-configured `EDITOR_ALLOWED_ORIGIN` for an intentional preview/alternative endpoint. Development without an override only accepts loopback HTTP. Forwarded client headers are not an origin or rate-limit identity. The five-attempt/minute budget is process-local and shared across clients: it cannot enforce distributed limits and may deny legitimate login under attack. Session cookies are stateless, expire after 14 days, and rotating the signing secret invalidates them; logout does not revoke a copied cookie. Actual deployment topology and distributed abuse prevention require operator verification.

The Chromium fixture collects WCAG 2.2 A/AA axe-core inventories (both locales, light/dark, desktop/narrow) and navigation/resource/Event Timing data. Violations are observations pending triage, not a conformance certificate. Interaction timing is a scripted lab sample; the dead external proxy blocks external traffic without disabling Chromium's HTTP cache. Cold/warm pairs measure the local production fixture, not field p75. Inspect waterfall cache hits, transfer sizes and decoded sizes separately from execution timing. Inspect keyboard focus visibility, focus order, screen reader announcements, 200%/400% zoom, target size and reduced motion manually before claiming WCAG conformance.

The checkout lease has a negative process-level regression test: competing invocation, unique output, signal cancellation, descendant termination and lease reacquisition. It uses a synthetic executable, not a browser or real content. Direct commands outside the lease, escaped process groups and SIGKILL of the orchestrator remain outside this guarantee.

## Editor deployment boundary (Vercel)

Owner policy: single owner; production editor only; non-production mutations may target synthetic content only; existing infrastructure; stateless sessions. Vercel-hosted Preview/custom environments disable the editor and adapter mutation paths even if editor credentials are accidentally inherited. Synthetic write acceptance uses the existing isolated loopback Git fixture, not a live GitHub repository. No remote synthetic repository has been authorized. A public production build without Vercel system environment metadata fails closed for editor access; enable automatic exposure of system environment variables and verify both VERCEL_ENV and VERCEL_TARGET_ENV are production. Scope production write credentials and session signing material to Production only. Do not copy production credentials to Preview. Preview public read credentials must be read-only and limited to appropriate data. Do not treat application code as a sandbox for untrusted PR builds.

Use Vercel WAF as the external rate-limit authority (not an application Redis service). Proposed rule: Production, POST, Server Action Name corresponding to loginEditorAdminAction (confirm emitted action name in Firewall logs and cover both locales/all dispatch routes), fixed 60-second window, 10 requests per IP per region, HTTP 429. First observe matching traffic in Log mode; verify valid login and synthetic repeated invalid login in an authorized test deployment before enforcement. Confirm rule availability and pricing in the project dashboard; no paid change or firewall publish is authorized by this code change. Vercel counters are per-region, not a global exact limit. Keep existing bounded process-local limiter as defense in depth until provider enforcement is verified. HMAC cookies retain the existing 14-day TTL; logout clears the local cookie only. Emergency revocation requires signing-key rotation and replacement/retirement of deployments using the old key. No per-session revocation guarantee.

References: https://vercel.com/docs/environment-variables/system-environment-variables ; https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting ; https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration .
