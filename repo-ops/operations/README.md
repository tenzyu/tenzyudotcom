# Repository operations

Acceptance and fixture tools live in `repo-ops/acceptance`, evidence in `repo-ops/evidence`, recovery in `repo-ops/recovery`, preview in `repo-ops/preview`, and dependency policy in `repo-ops/policy`. Root package commands delegate browser dependency builds to Nx and use a Linux checkout lease (`flock`). Direct script paths have moved as shown below.

Use Node 22 or later and a credential-free evaluation copy. These tools do not provide OS-level isolation or authorize deletion or publication. Logs, backups and browser traces belong in fresh, private locations outside Git.

## Inventory, command recording and preservation

```sh
node repo-ops/recovery/inventory.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_JSON"
node repo-ops/recovery/catalog.mjs "$NEW_EXTERNAL_JSON" "$NEW_EXTERNAL_CSV"
node repo-ops/evidence/run.mjs --cwd "$EVALUATION_REPO" --out "$NEW_EXTERNAL_RESULT_DIR" --timeout 120 -- bun test ./product/apps/web/src
node repo-ops/recovery/verify-restore.mjs "$TAR" "$RESTORED_PARENT" "$NEW_PRIVATE_REPORT"
node repo-ops/recovery/verify-source.mjs "$INVENTORY" "$RESTORED_REPO" "$NEW_PRIVATE_REPORT"
node repo-ops/recovery/preserve-worktrees.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_DIRECTORY"
```

The inventory inspects paths, Git state, symlinks, manifest files and size. CSV classifications propose changes. They do not authorize deletion. The runner records the exit code, time, timeout and SHA-256 and limits inherited environment variables. HOME remains available. The runner does not isolate the network or filesystem. It rejects overwriting evidence. Do not pass secrets on the command line.

Check the tar archive contents and hash. Extract it with `tar -xpf` into a new private parent directory. Never extract it into the original worktree. Restore verification reports group mismatches separately. Source verification does not attest ignored or new files. Worktree preservation records statuses, tar archives and a verified Git bundle. It deletes nothing. Stop writers before preservation.

## Read-only local preview

On NixOS with a user systemd manager, from the repository root in the appropriate already-loaded devShell:

```sh
bash repo-ops/preview/readonly-preview.sh start
bash repo-ops/preview/readonly-preview.sh status
bash repo-ops/preview/readonly-preview.sh stop
```

This copies committed `HEAD` into a fresh snapshot under `/tmp/opencode`, builds UI and serves loopback `127.0.0.1:43192` for at most one hour. It rejects editor writes/server actions and most WebSocket traffic and is not exposed to Tailscale. It restricts resources and filesystem access but does not isolate arbitrary untrusted code. Commit intended changes first and keep logs private.

## CI evidence and browser checks

The opt-in evidence workflow records the Git commit and tree, lockfile/config digests and toolchain versions for each artifact. Audit reports distinguish a valid empty response from a failed scanner. Advisory observations do not certify the absence of vulnerabilities. The workspace utility gate runs the path/runner, editor preload, preview gate and sanitizer tests.

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun run test:browser
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun --no-env-file run test:browser:editor
node --test repo-ops/acceptance/editor-github-preload.test.mjs
node --test repo-ops/evidence/run.test.mjs
```

If necessary, enter `nix develop .#browser-verification` once. Public acceptance uses Playwright with Chromium at 1440 px and 390 px. The server listens on port 4173. Tests read external public content without credentials. Editor acceptance uses port 4174, dummy credentials and a synthetic bare Git repository behind a fake GitHub transport that refuses external fetches. Fixture writes do not reach GitHub. Each root browser command creates a unique evidence subdirectory and acquires a nonblocking checkout lease. It refuses to run concurrently with another root browser command. Direct Next and Nx commands do not acquire that lease. Evidence contains `results.json`, the server log, event attachments and traces. Never commit evidence. The live-content suite remains Chromium-only. The separate deterministic public fixture uses all three Playwright engines, desktop and narrow viewports, port 4175, and a synthetic Git seed. It is opt-in via `bun --no-env-file run test:browser:fixture` or the evidence workflow. Publication acceptance archives an exact committed candidate or an explicit historical control. It never copies untracked or modified working-tree files. Commit intended changes before running it. The normal publication CI uploads fixture evidence, including checkout provenance. The opt-in workflow no longer repeats those suites. Use a separate checkout for other concurrent builds.

See the [Web verification skill](../../product/apps/web/.claude/skills/verify/SKILL.md) and [OKF operations notes](../../docs/wiki/operations.md).

## Retired renewal utilities

The candidate-state simulation, old preview probe for retired routes, host-specific OpenCode pairing helper, and one-off notes publication helper are no longer active tooling. Their original source and tests are preserved at [the pre-retirement commit](https://github.com/tenzyu/tenzyudotcom/tree/03d8ecd60828640836a3044d19fb0236ce157cb7/repo-ops/renewal). Use the retained browser suites for verification and the current infrastructure repository for host operations. This retirement does not remove any local data or change a running service.

Editor mutations now require the canonical `SITE_URL` origin in production, or a server-configured `EDITOR_ALLOWED_ORIGIN` for an intentional preview/alternative endpoint. Development without an override only accepts loopback HTTP. Forwarded client headers are not an origin or rate-limit identity. The limit of five attempts per minute applies within each process and is shared across clients. It cannot enforce distributed limits and may deny legitimate logins during an attack. Session cookies are stateless and expire after 14 days. Rotating the signing secret invalidates them. Logout does not revoke a copied cookie. Actual deployment topology and distributed abuse prevention require operator verification.

The Chromium fixture collects WCAG 2.2 A/AA axe-core inventories for both locales, light and dark modes, and desktop and narrow viewports. It also collects Navigation Timing, Resource Timing and Event Timing data. Violations are observations pending triage, not a conformance certificate. Interaction timing is a scripted lab sample. The nonfunctional external proxy blocks external traffic without disabling Chromium's HTTP cache. Cold/warm pairs measure the local production fixture, not field p75. Inspect waterfall cache hits, transfer sizes and decoded sizes separately from execution timing. Inspect keyboard focus visibility, focus order, screen reader announcements, 200%/400% zoom, target size and reduced motion manually before claiming WCAG conformance.

The supervisor retains the checkout directory file descriptor after acquiring its flock through a short-lived helper. It holds the same open file description throughout execution and bounded process-group drain, including after the leader exits. The leaf process does not inherit that descriptor. A failed drain returns nonzero and requires operator verification that no writers remain before retrying. The lock is released when the supervisor closes the descriptor or dies. Process-level regression tests cover collision, unique output, signal cancellation, successful and failed leader exit with a live worker during drain, cleanup failure and lease reacquisition. They use synthetic executables, not a browser or real content. Direct commands outside the lease, escaped process groups, undrainable kernel tasks and SIGKILL of the supervisor remain outside this guarantee. External timeout cancellation follows the same signal path. There is no new internal suite timeout.

## Editor deployment boundary (Vercel)

The owner's policy requires a single owner, a production-only editor, synthetic content only for non-production mutations, existing infrastructure and stateless sessions. Vercel-hosted Preview/custom environments disable the editor and adapter mutation paths even if editor credentials are accidentally inherited. Synthetic write acceptance uses the existing isolated loopback Git fixture, not a live GitHub repository. No remote synthetic repository has been authorized. A public production build without Vercel system environment metadata denies editor access. Enable automatic exposure of system environment variables and verify that both VERCEL_ENV and VERCEL_TARGET_ENV are production. The owner explicitly permits All Environments credential scope. Application runtime guards do not isolate inherited credentials from untrusted preview build code or dependencies. All code receiving canonical write credentials must be trusted. Deployment Protection and automatic system-variable exposure remain operator verification items. No secret values or remote writes are required. Do not treat application code as a sandbox for untrusted PR builds.

Use Vercel WAF to enforce external rate limits. Do not add an application Redis service for this purpose. On 2026-11-26 JST, the owner observed no recorded matches for the action-name selector. The Production + POST + Path ends with /editor/login selector recorded three requests in Log mode. The proposed final rule retains the path selector, uses a fixed 60-second window, limits requests to 10 per IP per region and returns HTTP 429. Matching alone does not establish enforcement. The synthetic regression in run 45739763640 reproduced successful Server Action dispatch from an unrelated page. Login now uses a form POST to the dedicated `/api/editor/login` Route Handler with same-origin validation and the existing rate limiter and session logic. The path suffix continues to match the new endpoint. Confirm provider normalization, final publication and enforcement separately. Do not load-test production. Logout remains a separate dashboard action. Confirm rule availability and pricing in the project dashboard. This code change does not authorize paid changes or firewall publication. Vercel counters apply per region. They do not enforce an exact global limit. Keep the existing bounded process-local limiter as a second control until provider enforcement is verified. HMAC cookies retain the existing 14-day TTL. Logout clears only the local cookie. Emergency revocation requires signing-key rotation and replacement/retirement of deployments using the old key. The application does not guarantee per-session revocation.

References:

- https://vercel.com/docs/environment-variables/system-environment-variables
- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration
