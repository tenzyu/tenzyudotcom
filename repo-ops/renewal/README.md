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

Before consolidating local branches and removing linked worktrees, preserve their non-generated files and Git state:

```sh
node repo-ops/renewal/preserve-worktrees.mjs "$SOURCE_REPO" "$NEW_EXTERNAL_DIRECTORY"
```

The destination's parent must exist. The tool discovers registered worktrees, records their status, creates private tar archives, compares each archive with its source, verifies an all-refs Git bundle, and separately preserves common Git metadata. `manifest.json` records hashes and the generated-output exclusions. Archives can contain secret configuration and must stay private. Stop writers before capture. The tool does not delete worktrees or branches.

## Start an isolated read-only preview

On NixOS with a user systemd manager, run these commands from the repository root:

```sh
nix develop --no-write-lock-file --command bash repo-ops/renewal/readonly-preview.sh start
nix develop --no-write-lock-file --command bash repo-ops/renewal/readonly-preview.sh status
nix develop --no-write-lock-file --command bash repo-ops/renewal/readonly-preview.sh stop
```

The preview copies tracked files from `HEAD` to a new directory under `/tmp/opencode`. Commit changes before starting it. The service installs its own dependencies, builds the UI package, and listens on `127.0.0.1:43192`. Check its journal for startup errors. The service stops after one hour and retains its snapshot.

The gate accepts public page and static asset requests. It rejects writes, editor routes, server actions, and WebSocket messages other than the development client subscriptions and pings. It is not a general-purpose Next.js development server. It does not expose the preview to the network. Use an authenticated proxy only after checking its access policy. The service has no editor, GitHub write, or osu! credentials. It uses systemd to limit resources, hide home directories, and make the filesystem read-only except for the snapshot. Do not use it as a sandbox for untrusted code.

## Browser observations

`preview.mjs` remains the exploratory probe described in `docs/renewal/07-browser-qa.md`. The acceptance suite uses Playwright Test 1.59.1 and Chromium at desktop 1440px and mobile 390px widths.

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c bun run test:browser
```

The shell uses Chromium 149.0.7827.53 from the root `flake.lock`. Playwright 1.59.1 targets Chromium 147 and was validated against this pinned Nix browser. The suite starts Next on `127.0.0.1:4173`, builds the UI package first, and stops the server after the run. Port 4173 must be free. It writes the JSON report, server log, browser-event attachments, failure screenshots, and traces to the external directory. It passes no editor, GitHub write, or osu! API credentials. Public content reads use the anonymous `tenzyu/tenzyudotcom-content` `main` branch.

Firefox and WebKit are not configured. Do not report them as covered.

## Prove editor publication without GitHub writes

Run this separate Chromium desktop journey from the repository root. Port 4174 must be free. Do not run it concurrently with the public suite because both servers use the app's `.next` directory.

```sh
PLAYWRIGHT_OUTPUT_DIR="$NEW_EXTERNAL_EVIDENCE" \
  nix develop .#browser-verification -c bun --no-env-file run test:browser:editor
node --test repo-ops/renewal/editor-github-preload.test.mjs
```

The journey uses the real login and scrap forms. It creates a draft, reloads it, edits the lead, appends a published entry and a draft entry, and publishes the scrap. A separate anonymous browser verifies the draft scrap is absent from the index and returns 404. After publication it follows the index link, reads the saved lead and published entry, and reloads the page. The draft entry stays hidden.

The package script builds the UI dependency through Nx before starting Playwright. `start-editor-browser-server.mjs` starts Node with an allowlisted environment and dummy editor and GitHub credentials. Its `NODE_OPTIONS --import` preload runs in inherited Node processes before Next. The preload bypasses Next's env-file loader. Bun commands use `--no-env-file`. No production code contains fixture flags.

The preload implements GitHub contents, blobs, trees, commits, and the main ref in memory for `api.github.com/repos/fixture/editor/`. Ref updates require a non-force fast-forward. Other fetches return 403, except GET requests to the loopback test server. No external fetch reaches the native network implementation. The fixture is a fetch-boundary test double, not an operating-system network sandbox.

The evidence directory contains `results.json`, `web-server.log`, `github-ledger.jsonl`, a browser trace, and a screenshot of the published page. The ledger records only method, pathname, and status. The journey asserts five successful ref updates and checks that every mutation targets the fixture. The fixture test replaces native fetch with a throwing function and checks external request denial, immutable snapshots, stale-ref rejection, and the env-loader bypass.

This opt-in suite does not change the read-only public suite. It covers Chromium at 1440px, not mobile, Firefox, or WebKit. Evidence includes dummy login data, so keep it outside Git.

## Verify the runner

```sh
node --test repo-ops/renewal/run.test.mjs
```

The tests exercise success, failure, missing executable, timeout, credential filtering, and evidence overwrite refusal.
