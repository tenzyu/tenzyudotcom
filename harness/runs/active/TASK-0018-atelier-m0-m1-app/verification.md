# Verification

## Commands Run

- `bun nx show project atelier --json`
- `bun nx run atelier:typecheck`
- `bun nx run atelier:test`
- `bun nx run atelier:doctor -- --json`
- `bun nx run atelier:build`
- `bun nx run atelier:check`
- `bun run policy:deps`
- `git diff --check`
- `git status --short --untracked-files=all`

## Command Results

- `bun nx show project atelier --json`: passed; Nx recognizes `atelier` as an application at `product/apps/atelier` with `doctor`, `build`, `typecheck`, `test`, `check`, and `verify` targets.
- `bun nx run atelier:typecheck`: passed.
- `bun nx run atelier:test`: passed; 6 tests passed.
- `bun nx run atelier:doctor -- --json`: passed as a command and emitted stable JSON. Current repository diagnostics: 232 documents, 33 errors, 268 warnings, 0 info. The errors are strict missing IDs in role/workflow/phase files, which is expected for M0/M1 detection.
- `bun nx run atelier:build`: passed.
- `bun nx run atelier:check`: passed; Nx ran the app check target and reused cached typecheck/test outputs for dependencies.
- `bun run policy:deps`: passed.
- `git diff --check`: passed.
- `git status --short --untracked-files=all`: shows new `product/apps/atelier/**` and this run's active artifacts only.

## Files Inspected

- `harness/knowledge/product-specs/atelier/README.md`
- `harness/knowledge/product-specs/atelier/ROADMAP.md`
- `product/apps/castalia/project.json`
- `product/packages/linter/project.json`
- `product/packages/linter/package.json`
- `nx.json`
- `package.json`

## Role Knowledge Checked

- Repo Ops Engineer required knowledge loaded.
- Implementer required knowledge loaded.

## Visual Checks Performed

None; this is CLI-first.

## Tests Added Or Not Added

Added Bun unit tests:

- `src/__tests__/frontmatter.test.ts`
- `src/__tests__/doctor.test.ts`

## Skipped Checks And Justification

- Did not run `bun nx run-many -t check`; this first slice is isolated to the new app and targeted app checks passed.
- Did not run visual checks; this is CLI-first and has no GUI.

## Failures And Follow-Up Recommendations

- No verification command failed.
- Follow-up: add frontmatter IDs to strict harness workflow/role/phase docs or tune strictness once the source contract is adopted.
- Follow-up: implement `atelier index` and context preview after doctor diagnostics are useful enough.

## Conclusion

Atelier M0/M1 app slice is implemented and verified with targeted Nx checks.
