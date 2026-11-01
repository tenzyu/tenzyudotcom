---
name: verify
description: Drive the tenzyu.com Next.js web UI with the Playwright browser acceptance harness when changing routes, locale behavior, navigation, responsive layout, osu! settings, or editor access.
---

# Verify the web app

## Launch

Choose a new private evidence directory outside the repository, then run:

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c bun run test:browser
```

The Playwright `webServer` builds `@tenzyu/ui`, starts Next on `127.0.0.1:4173`, waits for `/en/tools`, and owns teardown. Do not start a second server. Port 4173 must be free.

The launch clears editor, GitHub write, and osu! credentials. It reads public content anonymously from `tenzyu/tenzyudotcom-content` on `main`. Never add credentials to make a browser journey pass.

## Doctor

Run this read-only prerequisite check before diagnosing a launch failure:

```sh
nix develop .#browser-verification -c sh -c '
  test "$(bun pm ls | grep -c "@playwright/test@1.59.1")" -ge 1 &&
  test -x "$PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH" &&
  "$PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH" --version &&
  bunx playwright test --config repo-ops/renewal/playwright.config.ts --list
'
```

The browser must report Chromium 149.0.7827.53 from the locked Nix input. If the server readiness check times out, inspect `web-server.log` in the evidence directory before changing the test.

## Drive

Run the full matrix with the launch command. To drive one mapped feature while retaining the same startup, cleanup, and evidence behavior, add `--grep` after the script:

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c \
  bun run test:browser --grep "osu settings"
```

Use role, label, and route selectors already present in `repo-ops/renewal/browser-acceptance.spec.ts`. Do not replace observable assertions with implementation selectors. Read `features/README.md` before choosing a journey.

## Evidence

Keep `PLAYWRIGHT_OUTPUT_DIR` outside Git. A valid proof includes `results.json`, `web-server.log`, and each test's `browser-events.json`. Failures retain a screenshot and `trace.zip`. The suite treats every console error, page error, and failed request as a failure without a known-error allowlist.

Prove the user path and resulting page state. Status-only checks are insufficient for navigation, osu! settings, and the editor gate. The harness does not mutate content. A future editor mutation journey must intercept the existing GitHub HTTP boundary with an isolated fixture and must prove that no live network write occurred.

Chromium desktop 1440 and mobile 390 are covered. Firefox and WebKit are not configured and must remain reported as untested.

## Cleanup

Playwright stops the exact `webServer` process it started. Do not kill by process name. After an interrupted run, first confirm whether port 4173 is still owned by that run. Stop only that recorded process. Preserve the external evidence directory.

Do not delete `.next` or `product/packages/ui/dist` as cleanup. They are build outputs, not mutable user data.

## Helpers

`repo-ops/renewal/start-browser-server.mjs` is internal to Playwright's `webServer`. Do not invoke it directly. `repo-ops/renewal/playwright.config.ts` owns loopback startup, viewport projects, evidence paths, credential clearing, and cleanup.
