# TASK-0009: Castalia v0.2.5 Launcher Planning

## Context

Castalia v0.1 used `rofi` as the Linux launcher surface. v0.2 added prompt
authoring stability. The next planning step is v0.2.5: replace the `rofi`
dependency with a Castalia-owned launcher focused on low-friction prompt use.

## Goal

Document the v0.2.5 roadmap and design direction without starting
implementation.

## Scope

- Add v0.2.5 to `docs/product-specs/castalia/ROADMAP.md`.
- Capture design, implementation approach, simulation, risks, and user interview
  questions in this task folder.

## Non-Goals

- Do not implement the launcher.
- Do not remove the existing `rofi` command yet.
- Do not build prompt management UI; that belongs to v0.3 Tauri desktop.
- Do not decide Windows/macOS packaging details in this task.

## Acceptance Criteria

- v0.2.5 explains why Castalia should move beyond `rofi`.
- v0.2.5 defines the launcher user experience and boundaries.
- The implementation direction is concrete enough to evaluate before coding.
- Open concerns are written as interview questions for the human owner.
