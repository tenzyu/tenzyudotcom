# Castalia Product Spec

Castalia is a local-first prompt and skill launcher. It reduces the friction between deciding to use an AI workflow and placing the right prompt invocation into an input field.

## MVP goal

A Linux user can press a Hyprland keybind, select a prompt in `rofi`, optionally fill form slots, and copy the rendered prompt to the clipboard.

## Non-goals for MVP

- Android IME
- browser extension
- cloud sync
- account system
- prompt marketplace
- team collaboration
- prompt analytics
- AI prompt optimization
- Castalia-owned Hyprland/Home Manager options

## Success condition

```text
mod + p -> rofi -> select tc.pir -> fill change -> clipboard contains rendered prompt
```
