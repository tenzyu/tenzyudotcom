# Candidate state simulation — no executor

`candidate-state.mjs` stores untrusted candidate text as data, not instructions. It has no scheduler, network calls, automatic resume, or task executor. Test using `node --test repo-ops/renewal/candidate-state.test.mjs`. Store records privately and never include secrets.

`updateCandidate(file,event)`: `propose` fixes task/receipt/project/source/original and positive maxAttempts; `block_approval` records missing approval; `approve` fixes task/worktree/session but is **only a text assertion, not authenticated consent**. `start` begins an attempt, `checkpoint` records opaque state, `pause_rate_limit` records a condition; manual `resume` requires matching condition and nonempty **self-asserted** evidence while consuming another attempt. `fail` and `complete` are terminal. Duplicate/invalid transitions are rejected.

Updates use an exclusive lock directory, synced temporary file and rename. Crash may leave an ambiguous lock or state; parent directory is not fsynced. No cross-path coordination, adversarial filesystem safety or exactly-once side effect guarantee. Inspect manually before recovering a stale lock. A `running` record never proves real work executed. Never connect this simulation to automatic external side effects.
