# osu! settings eras

## Expected behavior

- The From 2026 era is selected by default.
- Current tablet and keypad settings remain visible.
- The Until 2025 tab exposes the historical note, tablet, and keypad settings.

## Open settings

Open `/en/osu`, scroll to Settings era, and switch from From 2026 to Until 2025.

## Playwright test

Run `--grep "osu settings"`. The test uses tab and region roles, then checks the historical explanatory text and viewport fit.

## Constraints

The suite supplies no osu! API credentials. Console errors caused by missing credentials fail the test. There is no allowlist exception. The settings assertion must remain even when live profile sections fail.
