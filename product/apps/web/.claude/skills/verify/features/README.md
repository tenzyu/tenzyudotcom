# Web verification tests

The following table lists the tests and their expected results.

| Feature | Test |
| --- | --- |
| [Public content and locale routes](public-content.md) | Default Japanese and explicit English retained routes |
| [Primary navigation](navigation.md) | Visible destinations and link traversal |
| [osu! settings eras](osu-settings.md) | Current default and historical tablet/keypad details |
| [Retired routes](retired-routes.md) | Removed routes return HTTP 404 |
| [Editor access gate](editor-gate.md) | Anonymous users reach login without modifying content |
| [Editor lifecycle](editor-lifecycle.md) | Opt-in desktop fixture checks creation, editing, appending entries, publication, reload and anonymous visibility |

Run every listed test in both configured Chromium projects unless the feature file narrows the matrix. A test fails if the route renders but the browser reports an error.
