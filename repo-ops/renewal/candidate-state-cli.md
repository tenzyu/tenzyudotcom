# Local candidate CLI

Manual record editor only: it does not execute, schedule, resume or make network calls. Use a new private directory, current-user-owned 0700, no symlink ancestors or hostile concurrent writers. No secrets or public storage.

```sh
mkdir -m 700 /private/path/candidates
node repo-ops/renewal/candidate-state-cli.mjs propose /private/path/candidates task-1
# stdin: {"receivedAt":"2026-11-02T12:00:00Z","project":"example","source":"manual","original":"text","maxAttempts":2}
node repo-ops/renewal/candidate-state-cli.mjs show /private/path/candidates task-1
node repo-ops/renewal/candidate-state-cli.mjs approve /private/path/candidates task-1
# stdin: {"worktree":"/path/to/worktree","session":"session-id","approval":"operator assertion"}
```

Terminate stdin JSON with EOF; `show` reads no stdin. IDs: ASCII letters/digits, underscore or hyphen, 1–64 characters, alphanumeric first. Existing IDs cannot be replaced. Path checks are not race-free against adversarial writers; lock recovery requires manual inspection. Untrusted text may contain terminal control characters, so inspect in a safe viewer. Approval is **not authorization**. See [state semantics](candidate-state.md).
