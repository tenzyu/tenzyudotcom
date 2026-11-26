# Repository operations reference

## Tool locations

| Directory | Responsibility |
| --- | --- |
| `repo-ops/acceptance` | Acceptance tests and fixtures |
| `repo-ops/evidence` | Evidence collection |
| `repo-ops/recovery` | Inventory, backup, and restore verification |
| `repo-ops/preview` | Read-only local preview |
| `repo-ops/policy` | Dependency policy |

Root package commands delegate browser dependency builds to Nx and use a Linux checkout lease (`flock`).

## Inventory and recovery

The inventory inspects paths, Git state, symlinks, manifest files, and size. CSV classifications propose changes. They do not authorize deletion. The runner records the exit code, time, timeout, and SHA-256. It limits inherited environment variables but leaves `HOME` available and does not isolate the network or filesystem. The runner refuses to overwrite evidence.

Restore verification reports group mismatches separately. Source verification does not attest ignored or new files. Worktree preservation records statuses, tar archives, and a verified Git bundle. It does not delete data.

## Read-only preview

The preview copies committed `HEAD` into a fresh snapshot under `/tmp/opencode`, builds the UI, and serves `127.0.0.1:43192` for at most one hour. It rejects editor writes, server actions, and most WebSocket traffic. It does not expose a Tailscale endpoint. Resource and filesystem restrictions do not isolate arbitrary untrusted code.

## Browser test suites

| Suite | Port | Browser and data |
| --- | --- | --- |
| Public acceptance | 4173 | Chromium at 1440 px and 390 px. Reads external public content without credentials. |
| Editor acceptance | 4174 | Dummy credentials and a synthetic bare Git repository. The GitHub fixture refuses external fetches. |
| Deterministic public fixture | 4175 | All three Playwright engines, desktop and narrow viewports, and a synthetic Git seed. |

The editor fixture does not write to GitHub. Each root browser command creates a unique evidence subdirectory and acquires a nonblocking checkout lease. A root browser command refuses to run while another root browser command holds the lease. Direct Next.js and Nx commands do not acquire that lease. Publication acceptance archives an exact committed candidate or an explicit historical control. It excludes untracked and modified working-tree files. Publication CI uploads fixture evidence with checkout provenance. The opt-in evidence workflow does not repeat those suites.

The opt-in evidence workflow records the Git commit, tree, lockfile and configuration digests, and toolchain versions for each artifact. Audit reports distinguish a valid empty response from a failed scanner. Advisory observations do not certify the absence of vulnerabilities. The workspace utility gate runs the path and runner tests, editor preload tests, preview gate tests, and sanitizer tests.

## Accessibility and performance measurement

The Chromium fixture collects WCAG 2.2 A/AA axe-core inventories for both locales, light and dark modes, and desktop and narrow viewports. It also collects Navigation Timing, Resource Timing, and Event Timing data. Violations are observations pending triage, not a conformance certificate. Interaction timing is a scripted lab sample. The nonfunctional external proxy blocks external traffic without disabling Chromium's HTTP cache. Cold and warm runs measure the local production fixture. They do not measure the 75th percentile of field data. Waterfall cache hits, transfer sizes, and decoded sizes require separate interpretation from execution timing. WCAG conformance also requires manual checks of keyboard focus visibility, focus order, screen reader announcements, zoom at 200% and 400%, target size, and reduced motion.

## Checkout lease and process cleanup

The supervisor retains the checkout directory file descriptor after acquiring its `flock` lock through a short-lived helper. It holds the same open file description throughout execution and bounded process-group drain, including after the leader exits. The leaf process does not inherit that descriptor. If the drain fails, the supervisor returns a nonzero exit code. The operator must verify that no writers remain before retrying. The kernel releases the lock when the supervisor closes the descriptor or exits. Process-level regression tests cover lease collisions, unique output, signal cancellation, leader success or failure with a live worker during drain, cleanup failure, and lease reacquisition. The regression tests use synthetic executables. They do not use a browser or real content. Direct commands outside the lease, escaped process groups, undrainable kernel tasks, and `SIGKILL` of the supervisor remain outside this guarantee. External timeout cancellation follows the same signal path. There is no new internal suite timeout.

## Retired renewal utilities

The candidate-state simulation, preview probe for retired routes, host-specific OpenCode pairing helper, and one-off notes publication helper are retired. Their original source and tests are preserved at [the pre-retirement commit](https://github.com/tenzyu/tenzyudotcom/tree/03d8ecd60828640836a3044d19fb0236ce157cb7/repo-ops/renewal). The retained browser suites replace the old verification tools. Host operations belong in the current infrastructure repository. The retirement did not remove local data or change a running service.
