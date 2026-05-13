# Known Problems

Use this file for recurring problems that future agents should know before
spending context or time.

## Nx Isolated Plugin Worker Failure

Observed while creating the initial AI organization documents:

```bash
bun nx show projects --json
```

Result:

Nx failed before returning project data because default plugin workers exited
before the connection was established. The failure affected default Nx plugins
and configured plugins such as `@nx/js/typescript`, `@nx/vite/plugin`, and
`@nx/storybook/plugin`.

Root cause:

- Nx 22 isolates project-graph plugins by default unless disabled by environment
  or recognized sandbox markers.
- In this Codex/Nix sandbox, Nx did not detect the sandbox automatically, so it
  tried to use isolated plugin workers.
- The workers started and exited before the parent established the socket
  connection.

Fix applied:

```bash
NX_ISOLATE_PLUGINS=false
```

The local root `.env` now sets this value. The repository currently ignores
`.env*`, so keep this as a local workspace setting unless the team explicitly
decides to commit a non-secret env file. Nx loads root `.env`, `.local.env`, and
`.env.local` before command dispatch, so normal commands such as:

```bash
bun nx show projects --json
```

work in this workspace.

Verification:

```bash
NX_ISOLATE_PLUGINS=false bun nx show projects --json
bun nx show projects --json
```

both returned:

```json
["skin-workbench","osu-skin-core","ui-react","linter","ui","web"]
```

Impact if the failure returns:

- Check whether `NX_ISOLATE_PLUGINS=false` is present in the command
  environment.
- Re-run with `--verbose` to confirm whether isolated plugin workers are being
  spawned.
- For documentation-only work, visible `project.json`, package files, and
  repository structure can be used as fallback evidence only when the failure is
  recorded in task verification.

Useful debug commands:

```bash
bun nx show projects --json --verbose
env | rg '^NX_ISOLATE_PLUGINS='
```
