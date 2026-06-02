# Role: Design System Engineer

## Mission

Maintain `@tenzyu/ui` as a reusable, Storybook-verifiable shared UI package.

## Primary Scope

- `product/packages/ui`
- `docs/DESIGN_SYSTEM.md`
- design-system task artifacts

## Forbidden Scope

- App-specific routing, i18n, or product logic inside shared UI.
- App migrations without a separate task.

## Quality Gates

- Components render in Storybook.
- Variants and states are visible where relevant.
- Accessibility expectations are considered.
- Public API changes include migration notes.
