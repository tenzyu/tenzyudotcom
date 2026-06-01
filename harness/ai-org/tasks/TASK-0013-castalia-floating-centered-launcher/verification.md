# Verification: TASK-0013

## Commands Run

- `bun nx run castalia:fmt`
- `bun nx run castalia:check`
- `bun nx run castalia:clippy`
- `bun nx run castalia:test`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `git diff --check`
- `bun nx run castalia:run -- launch --query tc.pir --set change=test --no-copy --prompt-dir prompts`
- `bun nx run castalia:run -- launch --prompt-dir prompts`
- `LD_LIBRARY_PATH=/nix/store/...-libxkbcommon-1.13.1/lib cargo run -p castalia -- launch --prompt-dir prompts`
- `LD_LIBRARY_PATH=/nix/store/...-libxkbcommon-1.13.1/lib target/release/castalia launch --prompt-dir prompts`
- `hyprctl clients -j`

## Command Results

- `castalia:fmt` passed.
- `castalia:check` passed. Nx also ran the dependent `castalia:test` target.
- `castalia:clippy` passed with `-D warnings`.
- `castalia:test` passed: 2 launcher tests and 6 core tests.
- `castalia:verify` passed: fmt, check, clippy, tests, and prompt validation all succeeded.
- `castalia:build` passed and produced the release binary.
- `git diff --check` passed with no output.
- Noninteractive `castalia launch --query tc.pir --set change=test --no-copy --prompt-dir prompts` passed and rendered the expected prompt.

## Files Inspected

- `harness/ai-org/org/charter.md`
- `harness/ai-org/memory/repo-map.md`
- `docs/AGENTS.md`
- `harness/ai-org/workflows/task-intake.md`
- `harness/ai-org/workflows/worktree-task-isolation.md`
- `harness/ai-org/workflows/implementation.md`
- `harness/ai-org/workflows/verification.md`
- `harness/ai-org/workflows/handoff.md`
- `harness/ai-org/agents/chief-of-staff.md`
- `harness/ai-org/agents/implementer.md`
- `harness/ai-org/agents/rust-tauri-engineer.md`
- `harness/ai-org/agents/test-engineer.md`
- `product/apps/castalia/crates/castalia-cli/src/launcher.rs`
- `product/apps/castalia/crates/castalia-cli/Cargo.toml`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/README.md`
- `docs/product-specs/castalia/ARCHITECTURE.md`

## Visual Checks Performed

- Attempted dev GUI smoke with `bun nx run castalia:run -- launch --prompt-dir prompts` under Hyprland. It failed before showing a window because the dev runtime could not load `libxkbcommon-x11.so`.
- Retried with `LD_LIBRARY_PATH` including Nix `libxkbcommon`; the release binary still failed before showing a window with a glutin config selection error.
- Because the local graphical smoke could not open a Castalia window, `hyprctl clients -j` did not show a Castalia client to confirm floating/centered state.
- The implementation therefore relies on eframe/winit hints plus documented Hyprland rules for environments where the GUI opens successfully.

## Tests Added Or Not Added

No automated tests were added. The changed behavior is native window-manager hint configuration and documentation. Existing launcher and core tests passed.

## Skipped Checks And Justification

- `bun nx run castalia:nix-build` was not run in the final pass because this task did not change Nix packaging and `castalia:build` covered the Rust binary. A prior `nix-run` smoke attempt began building the dirty worktree derivation but was interrupted during the GUI smoke attempt.
- Broad `bun nx run-many -t check` was not run because the changes are isolated to Castalia source/docs and task artifacts.
- `bun run policy:deps` was not run because no workspace dependency boundary changed.

## Failures And Follow-Up Recommendations

- The first `bun nx run castalia:fmt` failed because the new worktree had no `node_modules`; `bun install --frozen-lockfile` also failed because Bun wanted lockfile changes. A local `node_modules` symlink to the main checkout was used for Nx command resolution. The symlink is untracked and not part of the task diff.
- Manual GUI smoke is still blocked in this local environment by graphical runtime issues. Before merge or release, run the packaged Castalia launcher in the target Hyprland session and confirm either app-side hints are enough or the documented `windowrulev2` rules make the window floating and centered.
