# Renewal observation tools

Use Node 22 or later. These commands inspect a repository or run a command in a prepared evaluation copy. They are not a sandbox. Never point the preview or build runner at a tree containing production credentials.

## Record an inventory

```sh
node repo-ops/renewal/inventory.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_JSON"
node repo-ops/renewal/catalog.mjs "$NEW_EXTERNAL_JSON" "$NEW_EXTERNAL_CSV"
```

The inventory records paths, sizes, Git state, symlinks, package manifests, and pruned directories. It does not read secret contents or follow symlinks. Generated directories are explicitly excluded from detailed enumeration. CSV classifications are proposals, not approvals.

## Record a command

The output directory must not exist, and its parent must exist. Use an external private directory. Start with a restored copy excluding `.env*`, credentials, dependency caches, and generated build state.

```sh
node repo-ops/renewal/run.mjs --cwd "$EVALUATION_REPO" \
  --out "$NEW_EXTERNAL_RESULT_DIR" --timeout 120 -- bun test ./product/apps/web/src
```

Each result contains the actual exit code, status, command, duration, and output SHA-256. Timeouts terminate the process group. The child inherits only an explicit environment allowlist. HOME remains available for Nix and package caches, so this does not enforce filesystem or network isolation. Do not pass secrets on the command line.

## Verify preservation

```sh
node repo-ops/renewal/verify-restore.mjs "$TAR" "$RESTORED_PARENT" "$NEW_PRIVATE_REPORT"
node repo-ops/renewal/verify-source.mjs "$INVENTORY" "$RESTORED_REPO" "$NEW_PRIVATE_REPORT"
```

Extract the archive into a new private directory with `tar -xpf` before comparing it. The restore verifier reports group differences separately; it rejects other discrepancies. The source verifier compares the inventory's existing tracked/untracked files with the saved copy. It does not prove that new files were not added or that ignored files stayed unchanged.

Keep archive contents, restore reports, raw logs, and secret configuration outside Git. Inspect the tar member list and check its hash before restoring a backup from another source. Never restore over the original worktree.

## Browser observations

See `docs/renewal/07-browser-qa.md`. The probe launches its own loopback server on an ephemeral port. It records errors and returns nonzero if any observed route fails. It is not the final Playwright Test suite.

## Verify the runner

```sh
node --test repo-ops/renewal/run.test.mjs
```

The tests exercise success, failure, missing executable, timeout, credential filtering, and evidence overwrite refusal.
