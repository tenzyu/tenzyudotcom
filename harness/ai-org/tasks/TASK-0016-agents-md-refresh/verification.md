# Verification: TASK-0016

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| Read root docs and config | Passed | Verified repo structure, workspace, and CI facts from source files |
| Read existing AI instructions | Passed | Aligned with `HARNESS.md`, `docs/AGENTS.md`, and `harness/ai-org/README.md` |

## Files Inspected

- `README.md`
- `package.json`
- `nx.json`
- `.github/workflows/ci.yml`
- `docs/AGENTS.md`
- `HARNESS.md`
- `harness/ai-org/README.md`
- `harness/ai-org/org/charter.md`
- `harness/ai-org/memory/repo-map.md`
- `harness/ai-org/skills/*.md`
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
