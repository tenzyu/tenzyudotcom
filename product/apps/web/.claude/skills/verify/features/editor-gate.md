# Editor access gate

## Expected behavior

- Anonymous Japanese editor access redirects to `/editor/login`.
- Anonymous English editor access redirects to `/en/editor/login`.
- The login page renders without content mutation.

## Open the editor

Open `/editor` or `/en/editor` without an editor session.

## Playwright test

Run `--grep "editor requires"`. The test follows redirects, checks the login pathname for the requested locale and verifies visible main content, viewport fit and browser errors.

## Constraints

The default public suite clears editor credentials and GitHub tokens. Do not enter a password or submit content in that suite. Use the separate [editor lifecycle test](editor-lifecycle.md) for mutations against an in-memory GitHub fixture.
