# Verification: TASK-0010

## Commands Run

- `cargo fmt --all` from `product/apps/castalia`
- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:validate`
- `bun nx run castalia:run -- launch --query tc.pir --prompt-dir prompts --set change=test --no-copy`
- `bun nx run castalia:run -- launch --query tc.db --prompt-dir prompts --no-copy`
- `bun nx run castalia:run -- rofi --prompt-dir prompts`
- `mktemp -d /tmp/castalia-launch.XXXXXX`
- `bun nx run castalia:run -- launch --query demo.slot --prompt-dir /tmp/castalia-launch.7sKAka --slot-input editor --no-copy`
- `bun nx run castalia:run -- launch --query demo.slot --prompt-dir /tmp/castalia-launch.7sKAka --slot-input ui --set text=typed --no-copy`
- `bun nx run castalia:run -- launch --prompt-dir prompts --no-copy` in a PTY
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `bun nx run castalia:nix-build`
- `git add -N product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `git restore --staged product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `rm result`
- `git diff --check`

## Command Results

- `cargo fmt --all`: applied formatting.
- `castalia:check`: passed. It ran cargo tests and cargo check.
- `castalia:clippy`: initially failed on a `while_let_loop` lint in
  `launcher.rs`; after fixing, passed with `-D warnings`.
- `castalia:validate`: passed with `ok: 8 prompt(s) in prompts`.
- `launch --query tc.pir --set change=test --no-copy`: passed and rendered the
  slot value.
- `launch --query tc.db --no-copy`: passed and rendered a no-slot prompt.
- `rofi --prompt-dir prompts`: failed as expected with
  ``castalia rofi` was removed in v0.2.5; use `castalia launch``.
- Temporary prompt store checks passed:
  - editor slot input used `VISUAL=true EDITOR=true` and rendered the default
    slot value.
  - UI slot input was bypassed with `--set text=typed` and rendered `typed`.
- PTY launcher smoke check passed: searched `pir`, selected `tc.pir`, filled the
  multiline `change` slot, and rendered the prompt.
- `castalia:verify`: passed after implementation. It ran fmt check, cargo check,
  clippy, tests, and prompt validation.
- `castalia:build`: passed with `cargo build --release`.
- `castalia:nix-build` initially failed before invoking Nix because
  `project.json` used `outputs: ["result"]`; fixed to
  `["{workspaceRoot}/result"]`.
- `castalia:nix-build` then failed under sandboxed permissions because Nix
  needed to write its user fetcher cache; reran with escalation.
- Escalated `castalia:nix-build` then failed because Nix flake source does not
  include untracked files, so the new `launcher.rs` was invisible.
- Added an intent-to-add marker for `launcher.rs`, reran `castalia:nix-build`,
  and it passed.
- Removed the intent-to-add marker after the Nix build.
- Removed the generated `result` symlink.
- `git diff --check`: passed.

## Files Inspected

- `harness/actions/roles/implementer.md`
- `harness/actions/workflows/implementation.md`
- `harness/actions/workflows/verification.md`
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning/plan.md`
- `harness/knowledge/product-specs/castalia/README.md`
- `harness/knowledge/product-specs/castalia/ARCHITECTURE.md`
- `harness/knowledge/product-specs/castalia/ROADMAP.md`
- `product/apps/castalia/README.md`
- `product/apps/castalia/project.json`
- `product/apps/castalia/Cargo.toml`
- `product/apps/castalia/Cargo.lock`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/crates/castalia-core/src/lib.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`

## Visual Checks Performed

No graphical visual checks were needed. The launcher is terminal-native.

An interactive PTY smoke check was performed:

- started `castalia launch`
- typed `pir`
- selected `tc.pir`
- entered `hello from tty` into the multiline slot
- submitted with Ctrl-D
- confirmed rendered output contained `hello from tty`

## Tests Added Or Not Added

Added Rust unit tests in `launcher.rs` for:

- slot document parsing for editor mode
- prompt filtering by search text

No full terminal UI automation harness was added. The interactive behavior was
covered by the PTY smoke check and direct non-interactive command checks.

## Skipped Checks And Justification

- Full `bun nx run-many -t check` was not run because changes are isolated to
  Castalia and its docs. `castalia:verify`, `castalia:build`, and
  `castalia:nix-build` cover the affected release surface.

## Failures And Follow-Up Recommendations

- Nx rejected the old `nix-build` output path. This was fixed in
  `product/apps/castalia/project.json`.
- Nix build required an intent-to-add marker for the new source file because Nix
  flake source ignores untracked files. Future agents should remember this when
  verifying Nix builds with newly created source files before committing.
- The launcher is terminal-native, not a standalone graphical X11/Wayland
  window. This satisfies the low-overhead v0.2.5 release goal; if a graphical
  launcher is still desired later, keep it behind the `launcher.rs` boundary.
