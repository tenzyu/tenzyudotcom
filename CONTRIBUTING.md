# Contributing

Prefer small changes that preserve package and route boundaries.

Add new product code in the owning app first. Promote it to `src/features`, an
app-level library, or `product/packages/*` only when there is a real shared
contract.

When adding package exports:

- Add the export to `package.json`.
- Add or update a package smoke test.
- Keep consumers on public subpaths.
- Run the relevant Nx target through `bun nx`.

When adding dependencies:

- Do not use `*` or `latest`.
- Keep React, TypeScript, Vite, and Tailwind versions aligned with
  `repo-ops/scripts/check-dependency-policy.ts`.
- For optional UI advanced components, declare the dependency in the consuming
  app if that app imports the component.
