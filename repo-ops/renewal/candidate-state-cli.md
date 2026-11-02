# Local candidate CLI

This is a manual local record editor, not an executor. It does not make network calls, start work, or resume work. Run it only as a human-operated local command, in a trusted local environment. It accepts candidate text as JSON data and never evaluates it. Do not store secrets; do not publish the directory or its contents.

Create a private directory yourself, for example `mkdir -m 700 /private/path/candidates`. It must already exist, be owned by the current user, have no group or other permission bits, and have no symlink in its resolved path. IDs contain only ASCII letters, digits, `_`, or `-`, begin with a letter or digit, and have at most 64 characters. A proposal cannot replace an existing ID.

Provide a JSON object on standard input for these commands:

```sh
node repo-ops/renewal/candidate-state-cli.mjs propose /private/path/candidates task-1
# {"receivedAt":"2026-11-02T12:00:00Z","project":"example","source":"Obsidian","original":"candidate text","maxAttempts":2}
node repo-ops/renewal/candidate-state-cli.mjs show /private/path/candidates task-1
node repo-ops/renewal/candidate-state-cli.mjs approve /private/path/candidates task-1
# {"worktree":"/path/to/worktree","session":"session-id","approval":"operator approval"}
```

End JSON input with EOF. `show` does not read standard input. Approval records an assertion, not an authenticated identity or authorization. No operation starts a task. The CLI does not offer resume. See `candidate-state.md` for model and crash limitations.

These checks assume the private directory and its ancestors are not modified concurrently by an adversary (including another process running as the same user). Node's path-based checks do not provide race-free protection against hostile filesystem replacement. Do not use this tool with an untrusted directory, shared account, network filesystem, or automated executor. A crash can leave a lock and requires manual investigation; do not automatically clear it. Records may contain terminal control characters from untrusted text: inspect output in a safe viewer.
