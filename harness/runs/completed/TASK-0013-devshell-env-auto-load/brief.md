# Brief: Devshell `.env` auto-load

## title

Devshell `.env` auto-load

## background

The owner currently has to run `set -a; source .env; set +a` manually after entering a Nix devshell.

## problem

Repeated manual loading is error-prone and noisy.

## goal

When entering repository devshells, root `.env` values are automatically exported if `.env` exists.

## scope

- Nix devshell shell hook configuration
- Task verification and handoff records

## allowed files

- `nix/shell-hooks.nix`
- `harness/runs/completed/TASK-0013-devshell-env-auto-load*`

## forbidden files

- Application source files
- Package source files
- Secret `.env` contents

## non-goals

- Commit or inspect `.env` values
- Change app runtime environment parsing
- Add direnv or other new tooling

## constraints

- Keep change small and local to devshell behavior.
- Preserve existing shell completion hook behavior.

## role assignment

Repo Ops Engineer

## worktree isolation

- Branch: `ai/repo-ops/devshell-env-auto-load`
- Worktree path: `/tmp/nix-shell.EIDunI/opencode/tenzyudotcom-devshell-env`
- Base commit: `74b3517`
- Expected merge target: `develop`
- Cleanup expectation: remove worktree after review/merge or abandonment

## validation commands

- `nix flake check`

## acceptance criteria

- Entering a devshell sources root `.env` with automatic export when the file exists.
- Devshell still works when `.env` is absent.
- Existing completion hook behavior remains.

## risks

- Shell hook uses the current working directory; entering the shell away from the repository root will not find `./.env`.

## open questions

None.
