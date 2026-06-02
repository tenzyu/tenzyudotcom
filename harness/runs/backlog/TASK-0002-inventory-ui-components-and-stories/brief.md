# TASK-0002: Inventory `@tenzyu/ui` Components and Stories

## Problem

Agents need an accurate component and Storybook inventory before expanding the
design-system pilot beyond Button.

## Goal

Create or update an inventory of `@tenzyu/ui` components, exports, stories, and
obvious documentation gaps.

## Scope

Allowed files:

- `product/packages/ui/**`
- `harness/knowledge/product-specs/design-system.md`, if created or updated by the task
- relevant task docs under `harness/runs/backlog/TASK-0002-inventory-ui-components-and-stories`

Forbidden files:

- `product/apps/**`
- runtime behavior changes outside inventory needs

## Non-Goals

- Do not redesign components.
- Do not migrate apps.
- Do not normalize variants beyond documenting gaps.

## Validation

- Inventory source files inspected
- `bun nx run ui:check-storybook-catalog`, if available
- Additional relevant `ui` checks if inventory changes code or generated catalogs

## Acceptance Criteria

- Components and stories are listed.
- Missing stories or weak states are recorded.
- Follow-up tasks are separated from the inventory.
- `verification.md` and `handoff.md` are completed.
