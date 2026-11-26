# Editor lifecycle

## Expected behavior

- Anonymous editor access redirects to login.
- Login with dummy credentials opens the private workspace.
- A new draft scrap persists its title, hypothesis, and lead across reloads.
- Editing the lead and appending entries persist across reloads.
- An unpublished scrap returns 404 and does not appear in the public index.
- Publishing exposes the scrap, saved lead, and published entry to an anonymous reader.
- A draft entry remains hidden after the scrap is published.

## Run the test

Make sure port 4174 is free. From the repository root, run:

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c bun --no-env-file run test:browser:editor
```

The test uses Chromium at 1440px. The test uses the login form, the **Create a scrap** link, the metadata and lead form, the append-entry form, the saved-scrap link, and the publication checkbox. A separate browser context checks anonymous access and follows the public index link.

## Safety and evidence

The Node preload intercepts server-side GitHub fetches. It does not intercept browser requests. It keeps immutable trees and commits plus a mutable main ref in memory. Except for loopback GET requests, requests outside `api.github.com/repos/fixture/editor/` return HTTP 403. Next.js starts with dummy credentials and disables its environment file loader. Production code has no fixture flags.

Keep the JSON report, server log, request ledger, trace, and published screenshot outside Git. Five successful ref updates verify that creation, lead editing, two entry appends and publication reached storage. The test checks persisted form values, public rendered text, and hidden drafts. A successful action response alone does not verify persistence.

Run `node --test repo-ops/acceptance/editor-github-preload.test.mjs` to check the fixture's network denial and snapshot behavior separately.

Both suites use the app's `.next` directory. Do not run the editor and public suites concurrently. The fixture resets whenever the Next process restarts. This test does not verify real GitHub permissions or persistence across server restarts. The default public suite remains read-only.
