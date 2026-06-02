# Verification: TASK-0011

## Commands Run

- `bun nx show project castalia --json`
- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `bun nx run castalia:nix-build`
- `bun nx run castalia:run -- launch --query tc.pir --set change=test --no-copy --prompt-dir prompts`
- `LD_LIBRARY_PATH=... bun nx run castalia:launch`
- `hyprctl clients`
- `ps -ef | rg 'target/debug/castalia|castalia launch|Castalia'`
- `nix fmt product/apps/castalia/nix/package.nix`

## Command Results

- `castalia:check` passed, including 2 launcher tests and 6 core tests.
- `castalia:clippy` passed with `-D warnings`.
- `castalia:verify` passed: fmt check, cargo check, clippy, tests, and prompt
  validation all succeeded.
- `castalia:build` passed and produced the release binary.
- `castalia:nix-build` initially failed inside the sandbox because the Nix
  daemon socket was unavailable; the same Nx target passed with approved daemon
  access.
- `castalia:nix-build` passed again after adding GUI runtime library and Noto
  CJK font wrapping. The only remaining Nix warning was the expected dirty tree
  warning.
- Non-interactive launch smoke passed for `tc.pir` with `--set change=test
  --no-copy`.
- `nix fmt product/apps/castalia/nix/package.nix` failed because this flake does
  not define `formatter.x86_64-linux`; the file was kept in the existing Nix
  style manually.

## Files Inspected

- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/crates/castalia-cli/Cargo.toml`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/project.json`
- `product/apps/castalia/README.md`
- `harness/knowledge/product-specs/castalia/ARCHITECTURE.md`
- `harness/knowledge/product-specs/castalia/ROADMAP.md`
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/handoff.md`

## Visual Checks Performed

- Confirmed `castalia launch` opens a standalone `Castalia` GUI window under
  Hyprland/Xwayland.
- User confirmed the GUI starts.
- After closing the GUI, `hyprctl clients` and `ps` showed no remaining Castalia
  window or Castalia process.
- Japanese text initially rendered as missing glyph boxes. Root cause was egui's
  default fonts lacking CJK coverage. The package now sets
  `CASTALIA_GUI_FONT_PATH` to Noto Sans CJK and includes `fontconfig` for local
  font discovery.

## Tests Added Or Not Added

- No new automated GUI test was added. The GUI behavior was verified manually
  because the acceptance criteria require opening and closing an actual window.
- Existing launcher unit tests for prompt filtering and slot document parsing
  were preserved and passed.

## Skipped Checks And Justification

- Broad `bun nx run-many -t check` was not run because the scope is isolated to
  Castalia and its Nix package.
- `bun run policy:deps` was not run because no workspace package dependency
  boundary changed.

## Failures And Follow-Up Recommendations

- Sandbox GUI launch failed before approved graphical-session access, which is
  expected for windowed applications.
- Local dev launches without Nix wrapping need either system CJK fonts available
  through `fc-match` or `CASTALIA_GUI_FONT_PATH` set manually. The packaged Nix
  launcher sets this automatically.
