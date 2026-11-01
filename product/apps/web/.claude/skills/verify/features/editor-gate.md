# Editor access gate

## Sub-features

- Anonymous Japanese editor access redirects to `/editor/login`.
- Anonymous English editor access redirects to `/en/editor/login`.
- The login page renders without content mutation.

## How to get to it (user POV)

Open `/editor` or `/en/editor` without an editor session.

## Driving it with Playwright

Run `--grep "editor requires"`. The journey follows redirects, verifies the locale-correct login pathname and visible main content, and checks viewport fit and browser errors.

## Gotchas

The default public harness forces editor credentials and GitHub tokens empty. Do not enter a password or submit content in that suite. Use the separate [editor lifecycle journey](editor-lifecycle.md) for mutations against an in-memory GitHub fixture.
