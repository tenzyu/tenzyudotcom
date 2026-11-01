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

`preview.mjs` remains the exploratory probe described in `docs/renewal/07-browser-qa.md`. The acceptance suite uses Playwright Test 1.59.1 and Chromium at desktop 1440px and mobile 390px widths.

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c bun run test:browser
```

The shell uses Chromium 149.0.7827.53 from the root `flake.lock`. Playwright 1.59.1 targets Chromium 147 and was validated against this pinned Nix browser. The suite starts Next on `127.0.0.1:4173`, builds the UI package first, and stops the server after the run. Port 4173 must be free. It writes the JSON report, server log, browser-event attachments, failure screenshots, and traces to the external directory. It passes no editor, GitHub write, or osu! API credentials. Public content reads use the anonymous `tenzyu/tenzyudotcom-content` `main` branch.

Firefox and WebKit are not configured. Do not report them as covered.

## Verify the runner

```sh
node --test repo-ops/renewal/run.test.mjs
```

The tests exercise success, failure, missing executable, timeout, credential filtering, and evidence overwrite refusal.
