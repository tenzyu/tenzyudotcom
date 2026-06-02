# Worklog: TASK-0023 Atelier Context Plan/Render Split

## Changes

- Renamed the source-level context object from preview to plan.
- Replaced the CLI command `context preview` with `context plan`.
- Added the CLI command `context render`.
- Added the Nx target `atelier:context-plan`.
- Added the Nx target `atelier:context-render`.
- Removed the old `atelier:context-preview` target.
- Updated tests to assert plan behavior and render behavior separately.
- Updated the Atelier product spec and roadmap to describe plan/render semantics.
- Added required and conditional phase frontmatter to `workflow.isolated-run`.

## Decision

No compatibility alias was retained because the owner explicitly rejected keeping one.
