# Renewal closure, 2026-11-02

This report records verification on 2026-11-02. It does not establish current deployment or CI status. Build and unit tests used `77b05583e72e618b8266417673c378479d687402`. The final browser tests used `bf75057de11349146ba2fbd93106a9f0bf05f5ce`. The original report states that both commits had identical product runtime sources.

## Accepted changes

- Retired Atelier, Castalia, pointers, puzzles, recommendations, archives and old agent execution tools. Preserved blog, notes, scraps, links and tools. The home page emphasized osu! and engineering.
- Restored the live osu! API. Separated historical device settings and removed outdated annual goals. Fixed Japanese redirect loops and cookie persistence, Base UI interactions, hydration, UI state subscription and Nix runner PATH.
- Changed the scraps editor to publish multiple files in one commit. Added draft protection, stale-ref rejection, and translation-version checks. A separate correctness reviewer reproduced a race that exposed unpublished draft content. Fix `0dda91ed` binds public manifest, metadata and body reads to the same immutable commit. Concurrency regression tests followed.
- Separated Storybook type declaration generation from ordinary UI build to avoid overwriting shared generated typings.

## Historical test evidence

| Test scope | Result at 2026-11-02 |
| --- | --- |
| Nix/Nx Web production build including page-data collection | Passed |
| Web 140 tests, UI 9 tests, lint, typecheck | Passed |
| Dependency policy, workspace lint, scripts (11), runner/fixture (9) | Passed |
| Chromium public route/locale/navigation/osu settings/retired 404/editor gate, 1440/390 px | 32 passed |
| Editor login, draft creation, editing, publication and reload | Passed against an in-memory GitHub fixture. No production writes. |
| Read-only actual osu OAuth/profile/recent/best | HTTP 200, rendered data cross-checked |
| Public Tweet rendering, prevention of secret inheritance | Tested |

The evidence directory was `/home/tenzyu/Projects/tenzyudotcom-renewal-safety-20261101/final-20261102/`. Its current existence is unverified. The tests used Chromium 149.0.7827.53. The verification excluded Firefox, WebKit, physical smartphones, new host migration, GitHub CI and production deployment. Four existing non-null assertion warnings remained. A transient GitHub GET request returned HTTP 403. The cause was unconfirmed.

## Review, secrecy and history

GPT-6.1 Sol reviewers used separate contexts to detect and recheck the publication race, integration, and environment handling. "Independent context" means separate review contexts, not a different model family. Previous browser reports accidentally serialized sensitive parent environment values. Redaction removed known values and preserved suite statistics. It did not guarantee the absence of unknown credentials. The sanitized tar archive had SHA-256 `f0ecb015f60cb3b71d9b8239d69d1fb6a439367eefb159693c3922b04a768676`. Original raw evidence was privately isolated.

Ten registered worktrees and Git metadata were preserved with manifests, tar archives, hash checks and a Git bundle before cleanup. The required code was integrated into local `develop` by fast-forward to `1e85aca1`. Cleanup retired 19 branches and 9 linked worktrees. This was not a public deploy.

The [original immutable closure report](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal/12-completion.md) contains detailed evidence hashes, reviewer session IDs, excluded paths and recovery notes. See the [LLM Wiki](../wiki/index.md) for source-oriented documentation.
