# TASK-0007: Align Castalia With Monorepo Checks

## Background

`product/apps/castalia` is a Rust CLI app in the Bun + Nx monorepo. It is not a
Node package and should not need an app-local `package.json`.

## Problem

Initial review found that castalia was registered as an Nx project, but several
monorepo checks failed:

- dependency policy assumed every `product/apps/*` directory has `package.json`
- castalia Nx run targets referenced the wrong Cargo package name
- Rust formatting and clippy gates failed
- prompt validation was not hermetic to repository prompts
- form sample prompts did not declare the slots described by the docs

## Goal

Make castalia pass the relevant monorepo checks while preserving the Rust CLI
shape and avoiding a fake Node package.

## Scope

Allowed files:

- `repo-ops/scripts/check-dependency-policy.ts`
- `product/apps/castalia/**`
- task documentation under this folder

Non-goals:

- Do not convert castalia into a Node package.
- Do not remove CLI features.
- Do not broaden dependency policy beyond the package-json discovery fix.

## Role Assignment

- Lead role: Implementer
- Supporting role: Repo Ops Engineer
- Workflow: Implementation

## Acceptance Criteria

- `bun run policy:deps` passes without requiring `product/apps/castalia/package.json`.
- `bun nx run castalia:verify` passes.
- castalia run/validate targets call the real Cargo package.
- Repository prompt validation uses checked-in prompts.
- Task verification and handoff are recorded.
