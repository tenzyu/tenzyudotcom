# Public content and locale routes

## Sub-features

- Links, tools, blog, notes, scraps, and osu! public pages.
- Japanese at unprefixed URLs.
- English under `/en`.
- Responsive layout without horizontal overflow.

## How to get to it (user POV)

Open any retained route directly, such as `/notes` for Japanese or `/en/notes` for English.

## Driving it with Playwright

Run `--grep "retained routes"`. The journey visits every route in both locales, checks HTTP 200, final pathname, document language, viewport fit, and browser errors.

## Gotchas

Anonymous GitHub reads use the live public content repository. Assertions cover route and page health, not changing content snapshots. Default-locale redirect loops are product failures and must not be hidden by testing only `/en`.
