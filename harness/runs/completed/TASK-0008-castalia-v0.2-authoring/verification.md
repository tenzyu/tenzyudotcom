# Verification: TASK-0008

## Commands Run

- `bun nx run castalia:fmt`
- `bun nx run castalia:check`
- `bun nx run castalia:validate`
- `bun nx run castalia:run -- inspect tc.pir --prompt-dir prompts`
- `bun nx run castalia:run -- render tc.pir --prompt-dir prompts --set change=test`
- `mktemp -d /tmp/castalia-v02.XXXXXX`
- `bun nx run castalia:run -- new demo.prompt --prompt-dir /tmp/castalia-v02.66uTQ2 --title Demo --alias demo --tag test`
- `bun nx run castalia:run -- inspect demo.prompt --prompt-dir /tmp/castalia-v02.66uTQ2`
- `bun nx run castalia:run -- validate --prompt-dir /tmp/castalia-v02.66uTQ2`
- `env VISUAL=true EDITOR=true bun nx run castalia:run -- edit demo.prompt --prompt-dir /tmp/castalia-v02.66uTQ2`
- `bun nx run castalia:run -- new bad/missing --prompt-dir /tmp/castalia-v02.66uTQ2`
- `bun nx run castalia:run -- new demo --prompt-dir /tmp/castalia-v02.66uTQ2`
- `bun nx run castalia:run -- new self.alias --prompt-dir /tmp/castalia-v02.66uTQ2 --alias self.alias`
- `bun nx run castalia:clippy`
- `bun nx run castalia:verify`
- `bun nx run castalia:build`
- `git diff --check`

## Command Results

- `castalia:fmt`: passed after applying `cargo fmt --all`.
- `castalia:check`: passed. Rust unit tests ran as dependency and passed.
- `castalia:validate`: passed with `ok: 8 prompt(s) in prompts`.
- `inspect tc.pir`: passed and reported metadata, slot details, preview, and
  `validation: ok`.
- `render tc.pir`: passed and rendered the `change=test` slot.
- `new demo.prompt`: passed and created a prompt in `/tmp/castalia-v02.66uTQ2`.
- Temporary prompt `inspect` and `validate`: passed.
- Non-interactive `edit` with `VISUAL=true EDITOR=true`: passed and validated
  after the editor command exited.
- `new bad/missing`: failed as expected with an unsafe id validation error.
- `new demo`: failed as expected because `demo` conflicted with an existing
  alias.
- `new self.alias --alias self.alias`: failed as expected because the alias
  conflicted with the new id.
- `castalia:clippy`: passed with `-D warnings`.
- `castalia:verify`: passed; it ran fmt check, cargo check, clippy, tests, and
  prompt validation.
- `castalia:build`: passed with `cargo build --release`.
- `git diff --check`: passed.

## Files Inspected

- `AGENTS.md`
- `harness/policies/repository.md`
- `harness/canon/charter.md`
- `harness/knowledge/repo-map.md`
- `harness/actions/roles/implementer.md`
- `harness/actions/workflows/implementation.md`
- `harness/actions/workflows/verification.md`
- `harness/actions/workflows/handoff.md`
- `harness/knowledge/product-specs/castalia/README.md`
- `harness/knowledge/product-specs/castalia/ARCHITECTURE.md`
- `harness/knowledge/product-specs/castalia/ROADMAP.md`
- `harness/knowledge/product-specs/castalia/SECURITY.md`
- `product/apps/castalia/README.md`
- `product/apps/castalia/project.json`
- `product/apps/castalia/Cargo.toml`
- `product/apps/castalia/Cargo.lock`
- `product/apps/castalia/nix/package.nix`
- `product/apps/castalia/crates/castalia-core/src/lib.rs`
- `product/apps/castalia/crates/castalia-cli/src/main.rs`
- `product/apps/castalia/prompts/*.md`

## Visual Checks Performed

Not applicable. Castalia v0.2 is CLI-only.

## Tests Added Or Not Added

Added Rust unit coverage for:

- rejecting unknown prompt modes
- reporting undefined slot references
- prompt id safety validation

No integration test harness was added for the CLI. The new CLI behavior was
verified through Nx-run commands against the checked-in prompt store and a
temporary prompt store in `/tmp`.

## Skipped Checks And Justification

- `bun nx run castalia:nix-build` was not run. The Rust release build was run
  through `bun nx run castalia:build`; Nix package metadata changed only for the
  version string.
- Full `bun nx run-many -t check` was not run because the change was scoped to
  Castalia and docs. `castalia:verify`, `castalia:build`, and CLI smoke checks
  covered the affected behavior directly.

## Failures And Follow-Up Recommendations

- An initial non-interactive `edit` check used `EDITOR=true`, but `$VISUAL` was
  already set to Neovim and took precedence. That spawned Neovim in the sandbox;
  the process was killed and the check was rerun with both `VISUAL=true` and
  `EDITOR=true`.
- Follow-up: consider adding a dedicated CLI integration test harness if
  Castalia command behavior continues to grow.
