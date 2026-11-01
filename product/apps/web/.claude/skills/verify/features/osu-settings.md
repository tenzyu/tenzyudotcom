# osu! settings eras

## Sub-features

- The From 2026 era is selected by default.
- Current tablet and keypad settings remain visible.
- The Until 2025 tab exposes the historical note, tablet, and keypad settings.

## How to get to it (user POV)

Open `/en/osu`, scroll to Settings era, and switch from From 2026 to Until 2025.

## Driving it with Playwright

Run `--grep "osu settings"`. The journey uses tab and region roles, then checks the historical explanatory text and viewport fit.

## Gotchas

The harness intentionally supplies no osu! API credentials. Missing-credential console errors are real failures, not an allowlisted test condition. The settings assertion must remain even when live profile sections fail.
