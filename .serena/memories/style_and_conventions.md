# Style and Conventions: tenzyudotcom

## Naming Conventions
- **Files**:
  - `*.source.ts`: Canonical source (item-level localized notes, static data).
  - `*.content.ts`: Intlayer meaning (localized prose, UI copy).
  - `*.contract.ts`: Boundary contract (Zod schemas, normalization).
  - `*.assemble.ts`: Joins source, content, and contracts for features/pages.
  - `*.test.ts`: Tests near their code owners.
- **Directory Structure**:
  - `route-local feature`: `src/app/[locale]/.../<route>/_features/*`
  - `shared feature`: `src/features/<domain>`
  - `site shell`: `src/components/shell`
  - `site-ui component`: `src/components/site-ui` (no domain knowledge)
  - `pure shared logic`: `src/lib`, `src/config`
  - `authored content`: `src/content`, `storage/editorial`

## General Coding Rules
- **Local-first**: Keep code local to its usage. Promote to shared only after reuse is real.
- **Feature-first**: Don't use syntax-based directories (e.g., `components/`, `hooks/`) as top-level containers. Use them only inside features.
- **Proximity**: Keep everything related to a feature (UI, logic, data, tests) in the same directory.
- **Contracts**: Define boundary contracts (`*.contract.ts`) for external data, frontmatter, and search params.
- **Entry Points**: `page.tsx` and `layout.tsx` should only "receive, connect, delegate". Move logic to `_features/` and `*.assemble.ts`.
- **i18n**: Use Intlayer for localized copy. Static identifiers go to `*.source.ts` or `_data/`.

## Linting & Formatting
- All code must follow Biome linting and formatting rules.
- Run `bun run lint:fix` or `bun run format` to fix issues automatically.
