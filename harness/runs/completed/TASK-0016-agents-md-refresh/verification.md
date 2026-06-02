# Verification: TASK-0016

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| Read root docs and config | Passed | Verified repo structure, workspace, and CI facts from source files |
| Read existing AI instructions | Passed | Aligned with `harness/canon/legacy/root-HARNESS.md`, `harness/policies/repository.md`, and `harness/canon/legacy/ai-org-readme.md` |

## Files Inspected

- `README.md`
- `package.json`
- `nx.json`
- `.github/workflows/ci.yml`
- `harness/policies/repository.md`
- `harness/canon/legacy/root-HARNESS.md`
- `harness/canon/legacy/ai-org-readme.md`
- `harness/canon/charter.md`
- `harness/knowledge/repo-map.md`
- `harness/policies/tools/*.md`
- representative project manifests under `product/apps` and `product/packages`

## Visual Checks

Not applicable.

## Tests

- Added: none
- Existing coverage used: none
- Not added because: this is an instruction-file update only

## Skipped Checks

- `bun run policy:deps`
- `bun nx run-many -t check`

## Failures

- None

## Conclusion

Verified by source inspection.
