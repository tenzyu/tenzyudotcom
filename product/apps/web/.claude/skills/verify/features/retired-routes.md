# Retired routes

## Expected behavior

- `/archives/osu-profile`.
- `/pointers`.
- `/puzzles`.
- `/recommendations`.
- Each route returns HTTP 404 in Japanese and English.

## Open a retired route

Open a saved URL for one of the retired routes.

## Playwright test

Run `--grep "retired routes"`. The test requests every route with and without `/en` and requires HTTP 404. It checks viewport fit and records browser errors.

## Constraints

A redirect to home is not equivalent to retirement. Default-locale redirect loops are failures even when the corresponding `/en` route returns 404.
