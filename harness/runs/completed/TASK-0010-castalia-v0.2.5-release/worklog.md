# Worklog: TASK-0010

## 2026-06-02

- Created release task for v0.2.5 implementation.
- Chose terminal-native launcher as the first lightweight implementation because
  it avoids Tauri/GUI crate overhead and supports Unicode prompt text without
  adding rendering dependencies.
- Added `castalia-cli/src/launcher.rs` with prompt search, terminal slot input,
  editor slot input, clipboard-first mode, and direct `--query` launch support.
- Replaced the supported `rofi` command path with `castalia launch`.
- Removed `rofi` from Castalia Nix package wrapping and bumped version metadata
  to `0.2.5`.
