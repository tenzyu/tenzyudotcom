# Phase 2 file disposition

The baseline at `ca801532fd7109c953ad655a729eda5ac44d4d34` contained 43 files. Caller probe run 45635960034 produced artifact 15031659783. A literal reference to a caller candidate does not establish runtime use. The disposition retains active manual commands and does not delete data.

## Disposition conditions

The categories describe the decision and its possible consumers. They do not establish runtime reachability.

- Acceptance: acceptance tests, configuration, fixtures, or manual projection and declaration checks. Preserve contracts, synthetic Git, and browser checks.
- Evidence: workflow collectors or documented private operator evidence interfaces. Preserve provenance and failure behavior.
- Recovery: documented manual preservation and restore interfaces. Do not remove data or infer that code is unused.
- Preview: read-only preview entrypoints, imports, or tests. Preserve loopback access and the mutation gate.
- Policy: the root `policy:deps` command and CI.
- Historical migration and test: no live rerun is authorized.

## File mapping

To count the mapped baseline files, run this command from the repository root:

```sh
awk -F'|' '$2 ~ /^ (renewal|scripts)\// { n++ } END { print n }' docs/renewal/phase2-disposition.md
```

| Baseline under `repo-ops/` | Destination | Decision and category |
|---|---|---|
| renewal/audit-blog-projection.ts | acceptance/audit-blog-projection.ts | Move: acceptance |
| renewal/browser-acceptance.spec.ts | acceptance/browser-acceptance.spec.ts | Move: acceptance |
| renewal/browser-environment.mjs | acceptance/browser-environment.mjs | Move: acceptance |
| renewal/browser-environment.test.mjs | acceptance/browser-environment.test.mjs | Move: acceptance |
| renewal/editor-browser.spec.ts | acceptance/editor-browser.spec.ts | Move: acceptance |
| renewal/editor-github-preload.mjs | acceptance/editor-github-preload.mjs | Move: acceptance |
| renewal/editor-github-preload.test.mjs | acceptance/editor-github-preload.test.mjs | Move: acceptance |
| renewal/git-content-fixture.d.mts | acceptance/git-content-fixture.d.mts | Move: acceptance |
| renewal/git-content-fixture.mjs | acceptance/git-content-fixture.mjs | Move: acceptance |
| renewal/playwright.config.ts | acceptance/playwright.config.ts | Move: acceptance |
| renewal/playwright.editor.config.ts | acceptance/playwright.editor.config.ts | Move: acceptance |
| renewal/publication-fixture.mjs | acceptance/publication-fixture.mjs | Move: acceptance |
| renewal/publication-github-preload.mjs | acceptance/publication-github-preload.mjs | Move: acceptance |
| renewal/run-publication-acceptance.mjs | acceptance/run-publication-acceptance.mjs | Move: acceptance |
| renewal/start-browser-server.mjs | acceptance/start-browser-server.mjs | Move: acceptance |
| renewal/start-editor-browser-server.mjs | acceptance/start-editor-browser-server.mjs | Move: acceptance |
| renewal/ui-storybook-declarations.mjs | acceptance/ui-storybook-declarations.mjs | Move: acceptance |
| renewal/ui-storybook-declarations.test.mjs | acceptance/ui-storybook-declarations.test.mjs | Move: acceptance |
| renewal/architecture-evidence.mjs | evidence/architecture-evidence.mjs | Move: evidence |
| renewal/package-evidence.mjs | evidence/package-evidence.mjs | Move: evidence |
| renewal/evidence-summary.mjs | evidence/evidence-summary.mjs | Move: evidence |
| renewal/run.mjs | evidence/run.mjs | Move: evidence |
| renewal/run.test.mjs | evidence/run.test.mjs | Move: evidence |
| renewal/sanitize-evidence.py | evidence/sanitize-evidence.py | Move: evidence |
| renewal/sanitize-evidence.test.py | evidence/sanitize-evidence.test.py | Move: evidence |
| renewal/catalog.mjs | recovery/catalog.mjs | Move: recovery |
| renewal/inventory.mjs | recovery/inventory.mjs | Move: recovery |
| renewal/preserve-worktrees.mjs | recovery/preserve-worktrees.mjs | Move: recovery |
| renewal/verify-restore.mjs | recovery/verify-restore.mjs | Move: recovery |
| renewal/verify-source.mjs | recovery/verify-source.mjs | Move: recovery |
| renewal/readonly-preview-gate.mjs | preview/readonly-preview-gate.mjs | Move: preview |
| renewal/readonly-preview-gate.test.mjs | preview/readonly-preview-gate.test.mjs | Move: preview |
| renewal/readonly-preview-preload.mjs | preview/readonly-preview-preload.mjs | Move: preview |
| renewal/readonly-preview-server.mjs | preview/readonly-preview-server.mjs | Move: preview |
| renewal/readonly-preview.sh | preview/readonly-preview.sh | Move: preview |
| renewal/README.md | operations/README.md | Replace historical operational interface with current commands. |
| scripts/check-dependency-policy.ts | policy/check-dependency-policy.ts | Move: policy |
| scripts/biome | scripts/biome | Retain: Nix and workspace lint |
| scripts/completion.sh | scripts/completion.sh | Retain: Nix shell hook |
| scripts/docs-rename.ts | scripts/docs-rename.ts | Retain: root command and regression test |
| scripts/docs-rename.test.ts | scripts/docs-rename.test.ts | Retain: root command and regression test |
| scripts/migrate-notes-threading.ts | scripts/migrate-notes-threading.ts | Retain: historical migration and test |
| scripts/migrate-notes-threading.test.ts | scripts/migrate-notes-threading.test.ts | Retain: historical migration and test |
