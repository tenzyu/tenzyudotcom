# Verification: TASK-0022 frontmatter contract alignment

## Commands / Checks

| Check | Result | Notes |
| --- | --- | --- |
| strip completed run frontmatter | passed | No completed `*.md` starts with a frontmatter fence after migration. |
| scalar tag search | passed | No top-level `tags: a, b` scalar form remains in current harness Markdown. |
| top-level legacy metadata search | passed | No top-level `impactDescription`, `chapter`, `name`, `description`, or `user-invocable` remains outside completed run history. |
| removed legacy path search | passed for current guidance | Exact legacy path references are absent outside completed run history; completed historical records are intentionally allowed to preserve evidence. |
| product spec update | passed by inspection | Implementation location now points to `product/apps/atelier`, and the maintained source-contract decisions are documented. |
| roadmap update | passed by inspection | Existing M0/M1 language was corrected without adding a new milestone. |

## Skipped Checks

- `bun nx run atelier:check` was not run because `bun` is not installed in this sandbox.
- `bun nx run atelier:doctor -- --json` was not run for the same reason.

## Conclusion

The drop-in files are statically prepared and internally inspected. Final verification should run in the repository environment with Bun available.
