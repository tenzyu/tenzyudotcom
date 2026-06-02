# Design System

`@tenzyu/ui` is the shared design-system package and the first controlled AI
organization pilot area.

## Responsibilities

- Shared React UI primitives.
- Shared tokens and base styling.
- Component stories and visible state coverage.
- Package boundary checks for shared UI.
- Public component API documentation and migration notes.

## Non-Responsibilities

- App routing.
- App i18n.
- Product domain logic.
- Tauri or native APIs.
- App-local CSS patches required for base correctness.

## Component Standard

Every shared component should define:

- purpose
- public API
- variants and sizes, when relevant
- accessibility expectations
- Storybook stories
- visual states
- usage examples
- forbidden usage
- migration notes for breaking changes

## Pilot Tasks

- `harness/ai-org/tasks/TASK-0001-normalize-ui-button-variants/`
- `harness/ai-org/tasks/TASK-0002-inventory-ui-components-and-stories/`
- `harness/ai-org/tasks/TASK-0003-define-ui-styling-boundary/`
- `harness/ai-org/tasks/TASK-0004-storybook-validation-checklist/`
