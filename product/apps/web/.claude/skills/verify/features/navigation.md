# Primary navigation

## Sub-features

- Header destinations for links, tools, blog, notes, scraps, and osu!.
- Client navigation to a retained page.
- Responsive layout and clean browser events.

## How to get to it (user POV)

Open the English home page and use the primary navigation in the site header.

## Driving it with Playwright

Run `--grep "primary navigation"`. The journey finds the labelled navigation, checks retained destination links, follows Tools, and verifies the resulting URL.

## Gotchas

The app currently exposes Portfolio too, but it is outside this renewal acceptance list. Keep its presence from weakening assertions for the six retained destinations. Mobile navigation must be driven through its accessible controls if the shell changes.
