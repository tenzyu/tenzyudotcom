# Plan: TASK-0009

## Decision Under Evaluation

Replace `rofi` as Castalia's primary launch surface with a Castalia-owned
launcher. The core reason is that `rofi -dmenu` is a poor fit for editing
possibly long slot values, especially when `--set`-equivalent input needs to be
collected interactively. A first-party launcher also gives Castalia a more
portable path for future Windows and macOS support.

## Decisions

- `rofi` should not remain as a supported launch path after v0.2.5.
- Slot input defaults to Castalia's own UI.
- `$EDITOR`/`$VISUAL` remains as an escape hatch for editor-centric users.
- v0.2.5 targets Linux only, while avoiding architecture that blocks later
  Windows and macOS support.
- Do not default to Tauri for the launcher. The launcher should use the smallest
  viable Linux UI stack because the target behavior is `rofi`-like: invoked on
  demand, visible immediately, no daemon, copy, then exit.

## Intended User Experience

1. User invokes Castalia through a keybind or command, similar to the current
   `rofi` workflow.
2. A launcher window opens quickly and focuses search.
3. The list shows prompt title plus a short summary or body preview.
4. User searches and selects a prompt.
5. If the prompt has no slots, Castalia renders and copies immediately.
6. If the prompt has slots, Castalia opens a slot-fill screen.
7. Slot values can be edited in the launcher UI, read from the clipboard when
   configured, or delegated to `$EDITOR` for users who prefer editor bindings.
8. Castalia renders the prompt and copies it to the clipboard.

## Boundaries

- The launcher is for using prompts, not managing the prompt library.
- Prompt creation, metadata editing, validation panels, import/export, and
  broader prompt management remain v0.3 Tauri desktop scope.
- The launcher should reuse `castalia-core` for prompt loading, search,
  rendering, and validation.
- Existing CLI commands should remain available for scripts and fallback usage.
- The current `rofi` adapter should be removed or deprecated out of supported
  launch paths as part of v0.2.5, with CLI commands remaining as the fallback.

## Implementation Direction

- Add a launcher-specific Rust module/file under `castalia-cli`, for example
  `src/launcher.rs`, so command dispatch stays separate from UI state.
- Keep `main.rs` responsible for CLI parsing and command routing.
- Move launcher behavior behind a command such as `castalia launch`.
- Replace the supported keybind target with `castalia launch`.
- Do not keep `castalia rofi` as a supported long-term compatibility path.
- Introduce a small launcher config model before adding many flags:
  `slot_input_mode = ui | editor | clipboard-first`, plus a copy behavior such
  as `copy_on_render = true`.
- Default `slot_input_mode` to `ui`.
- Avoid Tauri unless evaluation proves it can satisfy low memory and immediate
  startup constraints.
- Choose a lightweight Linux UI stack that can provide fast search, keyboard
  navigation, title/summary rendering, multiline slot editing, clipboard copy,
  and predictable packaging.
- Do not introduce a daemon or resident background process.

## Simulation

### Prompt Without Slots

- Invoke launcher.
- Search `daily`.
- Select `tc.db`.
- Launcher renders the body immediately.
- Clipboard receives rendered prompt.
- Optional notification confirms copy.

This is equivalent to `rofi` today and should feel at least as fast.

### Prompt With One Multiline Slot

- Invoke launcher.
- Search `pir`.
- Select `tc.pir`.
- Slot screen opens with `change` label and multiline editor.
- User pastes or types the change description.
- Submit renders prompt and copies it.

This is the main improvement over `rofi`: multiline input is no longer forced
through repeated `dmenu` prompts or shell escaping.

### Editor-Oriented User

- Invoke launcher.
- Select a prompt with slots.
- Config says slot input mode is `editor`.
- Castalia creates a temporary slot input document and opens `$EDITOR`.
- User edits with Vim bindings and exits.
- Castalia parses the slot document, renders, and copies.

This preserves a keyboard-centric path without making the launcher a full
prompt-management editor.

### Launch Lifecycle

- The user presses the configured keybind.
- Castalia starts a short-lived launcher process.
- The launcher reads prompts, opens focused search, handles selection and slot
  input, copies the rendered prompt, then exits.
- No daemon, tray process, or persistent service is introduced in v0.2.5.

## Validity Assessment

The direction is sound because it removes a dependency that is actively shaping
the product UX around the wrong constraints. It also aligns with the stated
long-term platform goals. The main engineering risk is choosing a GUI stack that
cannot meet the startup and memory target. The launcher should be designed as a
thin UI over `castalia-core` so that the prompt model, rendering behavior, and
future Tauri desktop editor do not diverge.

## Risks

- GUI toolkit choice may constrain portability, packaging, startup time, and
  keyboard behavior.
- Removing `rofi` could regress current Linux users unless `castalia launch`
  reaches equivalent startup speed and keyboard ergonomics.
- Slot input modes can become product complexity if the config surface grows
  before real usage proves the defaults.
- Editor integration needs careful temporary-file handling so sensitive prompt
  slot content is not left behind unexpectedly.
- A custom Vim-like editor inside the launcher could add complexity and exclude
  users with different keyboard layouts; `$EDITOR` is the safer initial escape
  hatch.

## Resolved Interview Answers

1. `rofi` should not remain.
2. Default slot input mode is Castalia-owned UI.
3. Avoid Tauri for the launcher unless it unexpectedly proves lightweight enough;
   prefer the smallest viable Linux UI stack.
4. Vim-like editing inside the custom UI is not required. `$EDITOR` is enough as
   the initial escape hatch.
5. v0.2.5 targets Linux only.
