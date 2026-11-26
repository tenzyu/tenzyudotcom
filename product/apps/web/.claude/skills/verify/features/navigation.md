# Primary navigation

## Expected behavior

- The header links to links, tools, blog, notes, scraps, and osu!.
- Client-side navigation opens a retained page.
- The layout fits the viewport, and the browser reports no errors.

## Open primary navigation

Open the English home page and use the primary navigation in the site header.

## Playwright test

Run `--grep "primary navigation"`. The test finds the labelled navigation and checks the retained links. It follows **Tools** and verifies the resulting URL.

## Constraints

The app also exposes **Portfolio**. The renewal acceptance list does not include it. Keep assertions for all six retained destinations. If the shell changes, test mobile navigation through its accessible controls.
