# Worklog: TASK-0022 frontmatter contract alignment

## Notes

- Received owner decisions for frontmatter handling and source-contract strictness.
- Confirmed current Atelier code already has doctor, index, context preview, run init/close, context expansion, and knowledge proposal/promotion slices.
- Stripped frontmatter from completed run Markdown files to keep historical run history loose.
- Normalized active harness `tags` to YAML arrays.
- Moved top-level legacy display metadata into `x.legacy`.
- Updated adapters to route non-trivial work through `atelier run init` and `atelier run close`.
- Updated `doctor` diagnostics to distinguish current harness documents from completed historical run text.
- Updated the Atelier product spec and roadmap without adding new roadmap milestones.

## Environment Note

`bun` is not installed in this sandbox, so TypeScript build/test execution was not possible here.
