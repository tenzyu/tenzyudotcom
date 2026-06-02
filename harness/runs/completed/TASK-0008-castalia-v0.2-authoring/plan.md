# Plan: TASK-0008

## Implementation Strategy

1. Add reusable validation types and functions in `castalia-core`.
2. Keep prompt loading behavior compatible for normal commands, but make invalid
   schema values produce parse errors instead of silently defaulting.
3. Update CLI dispatch and help for `new`, `edit`, and `inspect`.
4. Implement `new` with atomic no-overwrite file creation and id/alias conflict
   checks.
5. Implement `edit` with `$VISUAL`/`$EDITOR`, then run validation on the prompt
   directory.
6. Implement `inspect` as a read-only prompt metadata and validation view.
7. Update product docs and run targeted Nx verification.

## Boundary Impact

- Changes stay inside the Castalia app.
- No shared package API is affected.
- Castalia remains a Rust-only Nx app and a local-first CLI.
- Prompt files remain the source of truth.

## Validation Strategy

- Add Rust unit tests for new validation behavior.
- Run `bun nx run castalia:validate`.
- Run representative CLI commands through `bun nx run castalia:run`.
- Run `bun nx run castalia:verify`.

## Rollback Considerations

All v0.2 changes are localized to Castalia. If needed, the new CLI commands and
validation functions can be reverted without affecting other repository projects.
