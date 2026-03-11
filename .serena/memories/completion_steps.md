# Completion Steps: tenzyudotcom

## Final Verification before Completion
Before finishing a task, ensure the following steps are performed:

1. **Verify Formatting & Linting**:
   - Run `nix develop --command bun run format` to ensure code style consistency.
   - Run `nix develop --command bun run lint:fix` to address any automated linting fixes.

2. **Verify Documentation**:
   - Run `nix develop --command bun run lint:docs` to check for documentation-specific linting issues (MDX files).

3. **Verify Tests**:
   - Run `nix develop --command bun run test` for all tests.
   - Run `nix develop --command bun run test:contracts` for critical boundary contracts.

4. **Verify Build**:
   - Run `nix develop --command bun run verify` to ensure the project builds correctly after changes.

5. **Update Plans**:
   - If working on an active plan (in `docs/exec-plans/active/`), ensure its status is updated.
   - If the task is completed, move the plan to `docs/exec-plans/completed/`.

6. **Promote Reusable Rules**:
   - If new patterns or rules were established during the task, consider promoting them to `docs/design-docs/` or `docs/workflows/` instead of leaving them only in the completion log.
