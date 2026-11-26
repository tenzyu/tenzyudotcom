# osu! settings eras

## Expected behavior

- **From 2026** is the default selection.
- Current tablet and keypad settings remain visible.
- **Until 2025** displays the historical note, tablet settings, and keypad settings.

## Open settings

1. Open `/en/osu`.
2. Scroll to **Settings era**.
3. Select **Until 2025** instead of **From 2026**.

## Playwright test

Run `--grep "osu settings"`. The test uses tab and region roles. It checks the historical explanatory text and viewport fit.

## Constraints

The suite supplies no osu! API credentials. Console errors caused by missing credentials fail the test. There is no allowlist exception. The settings assertion must remain even when live profile sections fail.
