---
title: detect local-first and di violations
description: Implement dependency-cruiser to detect local-first, promote-later and dependency-inversion violations
---

# Current Problem
The project lacks automated tooling to enforce architectural boundaries regarding "Local-first, Promote-later" and "Dependency Inversion".
We need to add `dependency-cruiser` to the `bun run lint` pipeline to ensure these rules are followed automatically.

## References

- [](/product-specs/others/detect-local-first-and-di-violations.md)
- [dependency-cruiser: isolating-peer-folder](https://github.com/sverweij/dependency-cruiser/blob/8de9c71c9b07be5cc41def3c0508cd57c37168fb/doc/recipes/isolating-peer-folders/.dependency-cruiser-with-rules.js)
- [dependency-cruiser: shared-or-not](https://github.com/sverweij/dependency-cruiser/blob/8de9c71c9b07be5cc41def3c0508cd57c37168fb/doc/recipes/shared-or-not/.dependency-cruiser-with-rules.js)
- [dependency-cruiser: All Rules Document](https://github.com/sverweij/dependency-cruiser/blob/8de9c71c9b07be5cc41def3c0508cd57c37168fb/doc/rules-reference.md)

## Task List
- [x] Install `dependency-cruiser` as a dev dependency.
- [x] Create and configure `.dependency-cruiser.cjs` (or `.js` / `.mjs`).
- [x] Implement `local-first, promote-later` rules:
  - `src/features/` should only be referenced if used by multiple routes/features.
  - `src/app/.../_features/` should not be referenced by other routes.
- [x] Implement `dependency-inversion` rules:
  - UI components (`*.tsx` etc.) must not depend directly on infrastructure implementations (`*.contract.ts`).
  - Domain layer (`*.domain.ts`) and Ports (`*.port.ts`) must not depend on outer layers (`*.contract.ts`, `*.assemble.ts`).
- [x] Update `package.json` to run `dependency-cruiser` as part of `bun run lint`.
- [x] Run the linter and add any existing violations to exceptions or fix them.

## Verification

- [x] **Verify Build**
  - Run `bun run build` to ensure no broken imports.
- [x] **Verify Linting**
  - Run `bun run lint` to ensure consistency.

## Success Criteria
- `dependency-cruiser` successfully catches configured architectural violations.
- `bun run lint` reports these errors.
- Existing intentional violations or tests are ignored in the configuration.
