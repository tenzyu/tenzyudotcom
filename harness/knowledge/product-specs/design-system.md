---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.design-system
title: Design System
status: active
summary: "@tenzyu/ui responsibilities, non-responsibilities, and component standard."
tags:
  - design-system
  - ui
  - product-spec
---

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

- `harness/runs/backlog/TASK-0001-normalize-ui-button-variants`
- `harness/runs/backlog/TASK-0002-inventory-ui-components-and-stories`
- `harness/runs/backlog/TASK-0003-define-ui-styling-boundary`
- `harness/runs/backlog/TASK-0004-storybook-validation-checklist`
