# Repository agent contract

- Start with the nearest `package.json`, public `exports`, `project.json` and tests. The [architecture map](docs/wiki/architecture.md) locates ownership; source and observed behavior override documentation.
- Products compose capabilities from libraries. Generic UI primitives must not depend on supporting patterns; neither depends on product code. Publishing and skin domain libraries own business invariants; revisioned-content owns persistence mechanics, not product rules. `repo-ops` is never a runtime dependency. Add reusable capability through the owning public API, not another application wrapper.
- Use the existing Bun workspace and Nx tasks: `bun nx show project <name> --json`, `bun nx run <name>:check`, `bun nx run <name>:verify`. On neko7 use its existing direnv shell; elsewhere enter the appropriate Nix devShell once. Preserve existing routes, data, authorization, publication consistency and native filesystem safety.
- Base topic branches on `develop`; do not merge, deploy, write external content or push to `main` without scoped authorization. Never read or expose secrets or `.env*`. Keep private evidence outside Git. Report failed/unrun verification and rollback boundaries.
- Historical ADRs are records, not instructions. Update the relevant architecture/operations entry only for durable code-backed changes; never invent verification.
