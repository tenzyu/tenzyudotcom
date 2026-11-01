# Renewal scope and implementation contract

Accepted by the product author on 2026-11-01.

Keep blog, notes, scraps, links and tools. Home presents osu! and engineering together. Do not publish undisclosed product concepts. Retire Atelier, Castalia, pointers, puzzles, recommendations and all archives routes. Leave skin-workbench source unchanged and do not run Rust builds.

The osu route is `/osu`. Keep live API reads, profile, historical settings, keypad and tablet settings. Remove yearly goals. Settings have `until2025` and `from2026` eras, defaulting to `from2026`. Only the supplied laptop identity is known for the new environment: dynabook BJ65/FS A6BJFSFAL511. Do not infer hardware specifications.

## Shared presentation contract

Candidate A is an editorial reading layout. Candidate B is a permanent navigation workspace with a mixed timeline. Choose A's smaller presentation interface. Retain B's single main landmark and explicit navigation registry. Avoid a configuration-driven page or form engine.

`@tenzyu/ui/editorial` owns `SiteFrame`, `PageIntro`, `ReadingColumn`, `EditorialList`, `EditorialEntry` and `EditorPanel`. These are small semantic React compositions using slots for framework-specific links and localized content. Web owns loaders, locale routing, authorization and mutations. No Next or Intlayer imports in these components. New brand tokens are scoped to `SiteFrame` so workbench does not change.

Workers have separate worktrees and commit only their assigned files. The coordinator merges and validates their combined output. No worker pushes, deploys, reads secret values or edits the content repository.

## Falsifiable acceptance

- Approved retired products have no active package, Nix, MCP, agent or CI entrypoints.
- Links and tools remain navigable. Removed pages and archives are absent.
- Both locale home pages describe osu! and engineering and do not disclose private concepts.
- The real osu page renders retained settings and selects 2026 by default, with an accessible switch to historical settings.
- Notes and scraps use shared UI. An authenticated editor can create and edit scraps. Failed and conflicting saves retain drafts.
- Nix Web shell supports dependency installation, typecheck, tests and production compilation without building Rust products.
- Browser verification at desktop and 390px checks route destinations, horizontal overflow, console errors and screenshots. Live API verification is recorded separately from fixture-based tests.
- Independent review gates integration into local develop. No remote push is requested.

## Throughput checkpoint

Four independently owned units run in parallel. The coordinator owns integration, dependency and runtime verification. Work is kept or corrected according to actual checks rather than generated file counts. No token savings or speedup is claimed. Large unknowns are live API availability and remote storage credentials. Neither permits silently replacing failed reads with fabricated current data.

Current backup is outside Git at `../tenzyudotcom-renewal-safety-20261101/`. Restore comparison verified contents and permissions, with group differences reported separately. The archive captured a changing Git metadata directory during observation; working files and prior complete backup remain independently preserved.
