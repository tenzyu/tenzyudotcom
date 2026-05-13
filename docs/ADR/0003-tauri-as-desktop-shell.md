# ADR 0003: Tauri as Desktop Shell

## Status

Draft

## Decision

The osu! skin workbench uses Tauri as the desktop shell, with native behavior
isolated under `product/apps/osu-skin-workbench/src-tauri`.

## Context

The workbench combines a React frontend with native filesystem and shell
capabilities.

## Consequences

- Native capabilities must be isolated behind explicit interfaces.
- Shared packages must not import Tauri APIs directly.
- Rust/Tauri validation is required when native code changes.
