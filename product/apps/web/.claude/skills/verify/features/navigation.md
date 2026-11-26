# Primary navigation

## Expected behavior

- Header destinations for links, tools, blog, notes, scraps, and osu!.
- Client navigation to a retained page.
- Responsive layout and clean browser events.

## Open primary navigation

Open the English home page and use the primary navigation in the site header.

## Playwright test

Run `--grep "primary navigation"`. The test finds the labelled navigation, checks the retained destination links, follows Tools and verifies the resulting URL.

## Constraints

The app currently exposes Portfolio too, but it is outside this renewal acceptance list. Keep its presence from weakening assertions for the six retained destinations. If the shell changes, test mobile navigation through its accessible controls.
