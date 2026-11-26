# Editor access gate

## Expected behavior

- Anonymous Japanese editor access redirects to `/editor/login`.
- Anonymous English editor access redirects to `/en/editor/login`.
- The login page renders without content mutation.

## Test anonymous editor access

Without an editor session, open `/editor` or `/en/editor`.

## Playwright test

Run `--grep "editor requires"`. The test follows redirects and checks the login pathname for the requested locale. It also checks visible main content, viewport fit, and browser errors.

## Constraints

The default public suite clears editor credentials and GitHub tokens. Do not enter a password or submit content in the public suite. Use the separate [editor lifecycle test](editor-lifecycle.md) for mutations against an in-memory GitHub fixture.
