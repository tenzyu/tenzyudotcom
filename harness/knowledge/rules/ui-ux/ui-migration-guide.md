# UI Migration Guide

This guide defines how app UI should move toward `@tenzyu/ui`.

## Rules

- Apps consume shared UI through package exports.
- App-specific behavior stays in app code.
- Shared components must not import app routes, app i18n, product domain logic, or Tauri APIs.
- Public API changes in `@tenzyu/ui` require migration notes.
- Migrations should be scoped by task and validated with affected app checks.

## Current Status

No broad app migration is approved by the initial AI organization rollout.

## Next Task

Use `harness/runs/backlog/TASK-0005-app-side-ui-migration-guide` to expand this
guide before implementation work begins.
