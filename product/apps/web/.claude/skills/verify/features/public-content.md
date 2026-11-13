# Public content and locale routes

## Sub-features

- Links, tools, blog, notes, scraps, and osu! public pages.
- Japanese at unprefixed URLs.
- English under `/en`.
- Responsive layout without horizontal overflow.

## How to get to it (user POV)

Open any retained route directly, such as `/notes` for Japanese or `/en/notes` for English.

## Driving it with Playwright

Run `--grep "retained route "`. Each URL has its own test, page, and browser-event collector. The 12 URLs are `/links`, `/en/links`, `/tools`, `/en/tools`, `/blog`, `/en/blog`, `/notes`, `/en/notes`, `/scraps`, `/en/scraps`, `/osu`, and `/en/osu`.

Each test checks HTTP 200, final pathname, document language, viewport fit, and browser errors. Both Chromium projects run all 12 URLs for 24 retained-route outcomes. The full public suite has 32 outcomes, including the four other journeys per project. Use `bun --no-env-file run test:browser --list` to list the current matrix.

## Gotchas

Anonymous GitHub reads use the live public content repository. Assertions cover route and page health, not changing content snapshots. Default-locale redirect loops are product failures and must not be hidden by testing only `/en`.

The automatic browser-event fixture checks captured errors before Playwright tears down each page. No retained-route test navigates away to the next URL, so that navigation cannot cancel the previous page's background requests. Console errors, page errors, and failed requests during the test still fail it. Only the existing exact retired-document 404 exception applies.
