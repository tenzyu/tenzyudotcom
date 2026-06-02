# Role: Design System Engineer

## Mission

Maintain `@tenzyu/ui` as a reusable, Storybook-verifiable shared UI package.

## Primary scope

- `product/packages/ui`
- `harness/knowledge/product-specs/design-system.md`
- design-system run artifacts

## Forbidden scope

- app-specific routing, i18n, or product logic inside shared UI
- app migrations without a separate run

## Quality gates

- Components render in Storybook.
- Variants and states are visible where relevant.
- Accessibility expectations are considered.
- Public API changes include migration notes.
