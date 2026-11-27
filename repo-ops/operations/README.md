# Run repository operations

The repository provides commands for acceptance tests, evidence collection, recovery, previews, and dependency checks. See the [operations reference](reference.md) for tool locations and process guarantees.

Use Node 22 or later and a credential-free evaluation copy. These tools do not provide operating-system isolation or authorize deletion or publication. Before you run a command, choose a new private directory outside Git for logs, backups, and browser traces.

## Record and preserve a checkout

Do not pass secrets on the command line. The runner leaves `HOME` available and does not isolate the network or filesystem. Stop writers before you preserve worktrees.

Run the commands relevant to your task:

```sh
node repo-ops/recovery/inventory.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_JSON"
node repo-ops/recovery/catalog.mjs "$NEW_EXTERNAL_JSON" "$NEW_EXTERNAL_CSV"
node repo-ops/evidence/run.mjs --cwd "$EVALUATION_REPO" --out "$NEW_EXTERNAL_RESULT_DIR" --timeout 120 -- bun test ./product/apps/web/src
node repo-ops/recovery/verify-restore.mjs "$TAR" "$RESTORED_PARENT" "$NEW_PRIVATE_REPORT"
node repo-ops/recovery/verify-source.mjs "$INVENTORY" "$RESTORED_REPO" "$NEW_PRIVATE_REPORT"
node repo-ops/recovery/preserve-worktrees.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_DIRECTORY"
```

Do not treat CSV classifications as deletion permission. The runner refuses to overwrite existing evidence.

To restore an archive, check its contents and hash first. Extract it with `tar -xpf` into a new private parent directory. Never extract it into the original worktree. See the [recovery guarantees](reference.md#inventory-and-recovery) before interpreting verification results.

## Start and stop a read-only preview

Use NixOS with a user systemd manager. Commit the intended changes first. Load the appropriate devShell and run these commands from the repository root:

Do not use the preview to run arbitrary untrusted code. Keep the logs private.

1. Start the preview:

	```sh
	bash repo-ops/preview/readonly-preview.sh start
	```

2. Check the status:

	```sh
	bash repo-ops/preview/readonly-preview.sh status
	```

3. Open `http://127.0.0.1:43192`. The preview runs for at most one hour and does not expose a Tailscale endpoint.
4. When you finish, stop the preview:

	```sh
	bash repo-ops/preview/readonly-preview.sh stop
	```

## Run browser checks and collect evidence

If necessary, run `nix develop .#browser-verification` once. Do not run the public and editor suites concurrently in the same checkout. Run the required commands:

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun run test:browser
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun --no-env-file run test:browser:editor
node --test repo-ops/acceptance/editor-github-preload.test.mjs
node --test repo-ops/evidence/run.test.mjs
```

To test the deterministic public fixture, run `bun --no-env-file run test:browser:fixture` or start the opt-in evidence workflow. Before you run publication acceptance, commit the intended changes. Use a separate checkout for concurrent builds. Keep `results.json`, the server log, event attachments, and traces outside Git. See the [browser test reference](reference.md#browser-test-suites) for ports, fixtures, and coverage.

See the [Web verification skill](../../product/apps/web/.claude/skills/verify/SKILL.md) and [repository verification and operational hazards](../../docs/wiki/operations.md).

## Retired renewal utilities

See the [retired tools reference](reference.md#retired-renewal-utilities). Do not run the retired tools against live services.

## Editor deployment boundary (Vercel)

See the [editor deployment and rate-limit reference](editor-deployment.md) before you change editor deployment or firewall settings.
