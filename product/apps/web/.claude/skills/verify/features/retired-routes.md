# Retired routes

## Sub-features

- `/archives/osu-profile`.
- `/pointers`.
- `/puzzles`.
- `/recommendations`.
- Default Japanese and explicit English variants.

## How to get to it (user POV)

Open an old saved URL directly.

## Driving it with Playwright

Run `--grep "retired routes"`. The journey requests every route with and without `/en`, requires HTTP 404, checks viewport fit, and records browser errors.

## Gotchas

A redirect to home is not equivalent to retirement. Default-locale redirect loops are failures even when the corresponding `/en` route returns 404.
