# Knowledge update history

## 2026-11-17

- Added OKF v0.2 concept files and an index so readers can open only the relevant files.
- Consolidated implemented workspace rules and Web failure modes from dated handoffs. Retained recovery paths to the exact Git snapshot.
- Removed obsolete handoffs and Serena memory. Preserved all nine ADRs without modification.
- This documentation rewrite did not establish the status of any live host, production deployment or repository-wide check.

- 2026-11-25: Retired bespoke architecture lint and began feature-owned Web organization (Links, Notes, contextual editor UI). CI acceptance pending.

- 2026-11-25: Removed obsolete renewal utilities, stale workbench lockfile, stateless editor factories and pass-through modules; consolidated equivalent Nix shells and dependency version authority. CI pending.

- 2026-11-25: Aligned Blog, Notes, Scraps, Links, osu and shared editor ownership; separated Content Store contracts from application cache policy. Publication and editor regression verification pending CI.

- 2026-11-25: Corrected editor composition ownership and Links post-commit refresh semantics after independent PRs #69 through #71 review. Enabled native Biome cycle detection and expanded fixture assertions. Full comparative review remains pending execution.

- 2026-11-25: Moved eight shared route-local modules to component, i18n and YouTube owners after scanning all 284 tracked Web TS/JS source modules. Added native reverse-alias restrictions; the static tracked-path graph after relocation has no multi-node SCC at file or owner level. The static graph does not verify compiler module resolution or matched preview results.

- 2026-11-25: Renewal candidate separates generic/supporting presentation, revisioned persistence, publishing domain and native wire contract. See [architecture](architecture.md). Verification applies to the tested revision. The candidate still requires CI.
