# Phase 2 baseline disposition

The baseline at `ca801532fd7109c953ad655a729eda5ac44d4d34` contained 43 files. Caller probe run 45635960034 produced artifact 15031659783. Literal caller candidates do not establish runtime use. The disposition retains active manual commands and does not delete data.

| Baseline (repo-ops/) | Destination | Disposition / consumer and condition |
|---|---|---|
| renewal/audit-blog-projection.ts | acceptance/audit-blog-projection.ts | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/browser-acceptance.spec.ts | acceptance/browser-acceptance.spec.ts | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/browser-environment.mjs | acceptance/browser-environment.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/browser-environment.test.mjs | acceptance/browser-environment.test.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/editor-browser.spec.ts | acceptance/editor-browser.spec.ts | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/editor-github-preload.mjs | acceptance/editor-github-preload.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/editor-github-preload.test.mjs | acceptance/editor-github-preload.test.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/git-content-fixture.d.mts | acceptance/git-content-fixture.d.mts | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/git-content-fixture.mjs | acceptance/git-content-fixture.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/playwright.config.ts | acceptance/playwright.config.ts | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/playwright.editor.config.ts | acceptance/playwright.editor.config.ts | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/publication-fixture.mjs | acceptance/publication-fixture.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/publication-github-preload.mjs | acceptance/publication-github-preload.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/run-publication-acceptance.mjs | acceptance/run-publication-acceptance.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/start-browser-server.mjs | acceptance/start-browser-server.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/start-editor-browser-server.mjs | acceptance/start-editor-browser-server.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/ui-storybook-declarations.mjs | acceptance/ui-storybook-declarations.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/ui-storybook-declarations.test.mjs | acceptance/ui-storybook-declarations.test.mjs | Move; Acceptance/config/fixture or manual projection/declaration check; preserve contract, synthetic Git and browser checks. |
| renewal/architecture-evidence.mjs | evidence/architecture-evidence.mjs | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/package-evidence.mjs | evidence/package-evidence.mjs | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/evidence-summary.mjs | evidence/evidence-summary.mjs | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/run.mjs | evidence/run.mjs | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/run.test.mjs | evidence/run.test.mjs | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/sanitize-evidence.py | evidence/sanitize-evidence.py | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/sanitize-evidence.test.py | evidence/sanitize-evidence.test.py | Move; Workflow collectors or documented private operator evidence interfaces; preserve provenance and failure semantics. |
| renewal/catalog.mjs | recovery/catalog.mjs | Move; Documented manual preservation/restore interface; no data removal or inferred dead code. |
| renewal/inventory.mjs | recovery/inventory.mjs | Move; Documented manual preservation/restore interface; no data removal or inferred dead code. |
| renewal/preserve-worktrees.mjs | recovery/preserve-worktrees.mjs | Move; Documented manual preservation/restore interface; no data removal or inferred dead code. |
| renewal/verify-restore.mjs | recovery/verify-restore.mjs | Move; Documented manual preservation/restore interface; no data removal or inferred dead code. |
| renewal/verify-source.mjs | recovery/verify-source.mjs | Move; Documented manual preservation/restore interface; no data removal or inferred dead code. |
| renewal/readonly-preview-gate.mjs | preview/readonly-preview-gate.mjs | Move; Read-only preview entrypoint and imports/tests; preserve loopback and mutation gate. |
| renewal/readonly-preview-gate.test.mjs | preview/readonly-preview-gate.test.mjs | Move; Read-only preview entrypoint and imports/tests; preserve loopback and mutation gate. |
| renewal/readonly-preview-preload.mjs | preview/readonly-preview-preload.mjs | Move; Read-only preview entrypoint and imports/tests; preserve loopback and mutation gate. |
| renewal/readonly-preview-server.mjs | preview/readonly-preview-server.mjs | Move; Read-only preview entrypoint and imports/tests; preserve loopback and mutation gate. |
| renewal/readonly-preview.sh | preview/readonly-preview.sh | Move; Read-only preview entrypoint and imports/tests; preserve loopback and mutation gate. |
| renewal/README.md | operations/README.md | Replace historical operational interface with current commands. |
| scripts/check-dependency-policy.ts | policy/check-dependency-policy.ts | Move; root policy:deps and CI. |
| scripts/biome | scripts/biome | Retain; Nix and workspace lint. |
| scripts/completion.sh | scripts/completion.sh | Retain; Nix shell hook. |
| scripts/docs-rename.ts | scripts/docs-rename.ts | Retain; root command and regression test. |
| scripts/docs-rename.test.ts | scripts/docs-rename.test.ts | Retain; root command and regression test. |
| scripts/migrate-notes-threading.ts | scripts/migrate-notes-threading.ts | Retain; historical migration and test; no live rerun authorized. |
| scripts/migrate-notes-threading.test.ts | scripts/migrate-notes-threading.test.ts | Retain; historical migration and test; no live rerun authorized. |
