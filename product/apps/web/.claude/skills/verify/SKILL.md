---
name: verify
description: Test the tenzyu.com Next.js web UI with the Playwright browser acceptance suite when changing routes, locale behavior, navigation, responsive layout, osu! settings, or editor access.
---

# Verify the web app

## Run the public suite

Choose a new private evidence directory outside the repository. Run:

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c bun run test:browser
```

The Playwright `webServer` builds `@tenzyu/ui`, starts Next on `127.0.0.1:4173`, waits for `/en/tools` and stops the server after the suite. Before you run the suite, make sure port 4173 is free. Do not start a second server.

The suite clears editor, GitHub write, and osu! credentials. It reads public content anonymously from `tenzyu/tenzyudotcom-content` on `main`. Never add credentials to make a browser journey pass.

## Check prerequisites

Run this read-only prerequisite check before diagnosing a launch failure:

```sh
nix develop .#browser-verification -c sh -c '
  test "$(bun pm ls | grep -c "@playwright/test@1.59.1")" -ge 1 &&
  test -x "$PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH" &&
  "$PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH" --version &&
  bunx playwright test --config repo-ops/acceptance/playwright.config.ts --list
'
```

The browser must report Chromium 149.0.7827.53 from the locked Nix input. If the server readiness check times out, read `web-server.log` in the evidence directory before you change the test.

## Test a single feature

Run the full matrix with the launch command. To test one feature with the same startup, cleanup and evidence collection, add `--grep` after the script:

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c \
  bun run test:browser --grep "osu settings"
```

Use role, label, and route selectors already present in `repo-ops/acceptance/browser-acceptance.spec.ts`. Do not replace observable assertions with implementation selectors. Read `features/README.md` before choosing a test.

## Collect evidence

Keep `PLAYWRIGHT_OUTPUT_DIR` outside Git. Retain `results.json`, `web-server.log`, and each test's `browser-events.json` as evidence. For failed tests, retain the screenshot and `trace.zip`. The suite treats every console error, page error, and failed request as a failure without a known-error allowlist.

Verify the user actions and resulting page state. HTTP status checks alone are insufficient for navigation, osu! settings and the editor gate. The suite does not mutate content. Any future editor mutation test must intercept GitHub HTTP requests with an isolated fixture and verify that no live network write occurred.

The suite tests Chromium at desktop and mobile viewport widths of 1440 px and 390 px. Firefox and WebKit are not configured. Report them as untested.

## Stop an interrupted test

Playwright stops the exact `webServer` process it started. Do not stop processes by name. If a run stops unexpectedly, check whether its server still listens on port 4173. Stop only that recorded process. Preserve the external evidence directory.

Do not delete `.next` or `product/packages/ui/dist` as cleanup. Both directories contain build outputs, not mutable user data.

## Helpers

`repo-ops/acceptance/start-browser-server.mjs` is internal to Playwright's `webServer`. Do not invoke it directly. `repo-ops/acceptance/playwright.config.ts` configures loopback startup, viewport projects, evidence paths, credential clearing and cleanup.
