# Worklog: TASK-0011

## 2026-06-02

- Owner tried TASK-0010 and identified the launcher as TUI, not the requested
  lightweight Linux GUI.
- Confirmed the owner wanted a `rofi`-like GUI launcher, not a terminal
  application run inside a terminal emulator.
- Created this correction task to re-scope v0.2.5 before further implementation.
- Confirmed `HEAD` includes `a504184 feat(castalia): introduce GUI launcher for
  Castalia and remove TUI dependency`, which moves `castalia launch` to an
  `eframe`/`egui` GUI and keeps the terminal fallback behind `launch-tui`.
- Verified the GUI opens as a standalone `Castalia` window under Hyprland/Xwayland
  and exits without leaving a Castalia process after closing.
- Investigated broken Japanese rendering in the GUI. Root cause was egui's
  built-in default fonts lacking CJK glyph coverage, while the rest of the OS
  had normal Japanese font fallback.
- Added Castalia Nix package runtime wrapping for GUI dynamic libraries and
  Noto CJK font availability so packaged launches can load X11/Wayland/GL
  libraries and render Japanese text.
