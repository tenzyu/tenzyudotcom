# Handoff: TASK-0022 frontmatter contract alignment

## Summary

Aligned harness frontmatter and Atelier doctor behavior with the owner-confirmed source-contract decisions.

## Changed

- Completed run Markdown is now loose historical text with generated frontmatter removed.
- Active harness frontmatter uses YAML array tags.
- Legacy display metadata is preserved under `x.legacy` instead of driving routing.
- Atelier doctor now warns on completed run frontmatter, scalar tags, legacy top-level fields, forbidden `knowledge.roles`, and missing domain-role routing metadata.
- Removed legacy path references are errors in current harness documents but warnings in completed history.
- Root and tool adapters now route non-trivial work through Atelier.
- Atelier product spec and roadmap reflect the implemented location and source-contract decisions.

## Remaining Risks

- Bun/Nx validation was not executable in this sandbox.
- Some historical completed runs still mention old paths by design.
- Some role body sections still list required knowledge as prose; future work may move more of that into `selectors` and `pinned` when useful.

## Follow-Up

Run in the real repository:

```bash
bun nx run atelier:check
bun nx run atelier:doctor -- --json
bun nx run atelier:index
bun nx run atelier:index-check
git diff --check
```
