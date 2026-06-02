# TASK-0006: Add Storybook to ui-react

## Background

`product/packages/ui-react` is a public React UI package with subpath component
exports such as `@tenzyu/ui-react/button`.

## Problem

The package did not have Storybook configuration, colocated component stories,
or package-local design-system documentation/pattern/regression stories.

## Goal

Add Storybook for `@tenzyu/ui-react` using colocated component stories and keep
`src/stories` dedicated to foundations, composed patterns, and regression
checks.

## Scope

Allowed files:

- `product/packages/ui-react/**`
- package manager metadata needed for Storybook dependencies
- task documentation under this folder

Non-goals:

- Do not migrate all existing UI components to stories.
- Do not redesign component APIs.
- Do not fix unrelated lint debt across existing `ui-react` components.

## Role Assignment

- Lead role: Design System Engineer
- Workflow: Implementation

## Acceptance Criteria

- Storybook has React Vite config under `product/packages/ui-react/.storybook`.
- Component stories for Button, Dialog, Accordion, and Card are colocated with
  implementation files.
- `src/stories` contains docs/pattern/regression examples, not component catalog
  stories.
- Root API remains foundation-oriented.
- Narrow verification results are recorded.

