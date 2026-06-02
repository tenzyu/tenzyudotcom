# ADR 0002: `@tenzyu/ui` Package Boundary

## Status

Draft

## Decision

`@tenzyu/ui` owns shared UI primitives, tokens, stories, and base styling. It
must not depend on app routing, app i18n, product domain logic, Tauri APIs, or
app-local CSS patches for base correctness.

## Context

The design-system pilot depends on a clear boundary between reusable UI and app
composition.

## Consequences

- Public component API changes require migration notes.
- Storybook should be a primary validation surface.
- App-specific behavior remains in app code.
