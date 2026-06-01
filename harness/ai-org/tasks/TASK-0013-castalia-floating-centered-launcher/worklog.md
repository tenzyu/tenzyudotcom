# Worklog: TASK-0013

## 2026-06-02

- Corrected initial process mistake: the task brief was first created in the main checkout, then moved into the isolated worktree.
- Active branch: `ai/castalia/floating-centered-launcher`.
- Active worktree: `/home/tenzyu/Documents/.worktrees/tenzyudotcom/castalia-floating-centered-launcher`.
- Base commit: `74b3517 feat(castalia): update v0.2.5 GUI launcher implementation and Nix packaging for CJK support`.
- Expected merge target: `develop`.
- Added eframe viewport hints for the launcher: stable title/app id, smaller fixed size, centered native option, borderless window, always-on-top, and X11 dialog window type.
- Documented that Wayland compositors and tiling WMs may require local float/center rules despite app-side hints.
