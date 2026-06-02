# Handoff: Devshell `.env` auto-load

## task summary

Make repository devshells automatically export values from root `.env` on entry.

## what changed

- Added a guarded `.env` source block to `nix/shell-hooks.nix` common shell hook:
  - checks `./.env` exists
  - runs `set -a`
  - sources `./.env`
  - runs `set +a`

## why it changed

The owner did not want to manually run `set -a; source .env; set +a` after entering devshells.

## affected files

- `nix/shell-hooks.nix`
- `harness/runs/completed/TASK-0013-devshell-env-auto-load/brief.md`
- `harness/runs/completed/TASK-0013-devshell-env-auto-load/verification.md`
- `harness/runs/completed/TASK-0013-devshell-env-auto-load/handoff.md`

## validation result

- `nix flake check`: passed.

## remaining risks

- The hook checks `./.env`, so it expects devshell entry from the repository root. Existing completion hook logic already uses the same current-directory pattern for `./repo-ops/...`.

## follow-up tasks

None.

## memory updates made or proposed

No durable memory update proposed; this is a small local devshell behavior change.
