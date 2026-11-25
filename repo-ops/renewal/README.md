# Renewal observation tools

Node 22+; use only a credential-free evaluation copy. **These tools are not an OS sandbox and do not authorize deletion or publication.** Logs, backups and browser traces belong in fresh, private locations outside Git.

## Inventory, command recording and preservation

```sh
node repo-ops/renewal/inventory.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_JSON"
node repo-ops/renewal/catalog.mjs "$NEW_EXTERNAL_JSON" "$NEW_EXTERNAL_CSV"
node repo-ops/renewal/run.mjs --cwd "$EVALUATION_REPO" --out "$NEW_EXTERNAL_RESULT_DIR" --timeout 120 -- bun test ./product/apps/web/src
node repo-ops/renewal/verify-restore.mjs "$TAR" "$RESTORED_PARENT" "$NEW_PRIVATE_REPORT"
node repo-ops/renewal/verify-source.mjs "$INVENTORY" "$RESTORED_REPO" "$NEW_PRIVATE_REPORT"
node repo-ops/renewal/preserve-worktrees.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_DIRECTORY"
```

Inventory inspects paths, Git state, symlinks, manifest files and size; CSV classifications are proposals, never deletion permission. Runner records exit code, time, timeout and SHA-256 and limits inherited environment, but HOME remains available and network/filesystem isolation is **not** enforced. It rejects overwriting evidence. Do not pass secrets on the command line.

Check tar membership and hash; extract with `tar -xpf` into a new private parent, never the original worktree. Restore verification distinguishes group mismatch; source verification does not attest ignored/new files. Worktree preservation records statuses, tar archives and verified Git bundle; it does not delete anything. Stop writers before preservation.

## Read-only local preview

On NixOS with a user systemd manager, from the repository root in the appropriate already-loaded devShell:

```sh
bash repo-ops/renewal/readonly-preview.sh start
bash repo-ops/renewal/readonly-preview.sh status
bash repo-ops/renewal/readonly-preview.sh stop
```

This copies committed `HEAD` into a fresh snapshot under `/tmp/opencode`, builds UI and serves loopback `127.0.0.1:43192` for at most one hour. It rejects editor writes/server actions and most WebSocket traffic and is not exposed to Tailscale. It has resource/filesystem constraints, **not arbitrary untrusted-code isolation**. Commit intended changes first; preserve logs privately.

## Browser checks

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun run test:browser
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" bun --no-env-file run test:browser:editor
node --test repo-ops/renewal/editor-github-preload.test.mjs
node --test repo-ops/renewal/run.test.mjs
```

If necessary, enter `nix develop .#browser-verification` once. Public acceptance uses Playwright/Chromium 1440/390 px, server at port 4173, credential-free and read-only external public content. Editor acceptance uses port 4174, dummy credentials and an in-memory fake GitHub that refuses external fetch; fixture writes do **not** reach GitHub. **Do not run public and editor suites concurrently**: they share the app's `.next`. Evidence contains `results.json`, server log, event attachments and traces; never commit it. Firefox/WebKit are not configured.

See the [Web verification skill](../../product/apps/web/.claude/skills/verify/SKILL.md) and [OKF operations notes](../../docs/wiki/operations.md).

## Retired renewal utilities

The candidate-state simulation, old preview probe (which targeted retired routes), host-specific OpenCode pairing helper, and one-off notes publication helper are no longer active tooling. Their original source and tests are preserved at [the pre-retirement commit](https://github.com/tenzyu/tenzyudotcom/tree/03d8ecd60828640836a3044d19fb0236ce157cb7/repo-ops/renewal). Use the retained browser suites for verification and the current infrastructure repository for host operations. This retirement does not remove any local data or change a running service.
