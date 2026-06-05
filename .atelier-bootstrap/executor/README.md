# atelier-executor

Packet execution and evidence loop for Atelier v0.

## Responsibility

```txt
PacketTemplate / ExecutionPacket
  ↓
test_run (executable command)
  ↓
evidence (raw output, file hashes, command ref)
  ↓
handoff (atelier.subagent-handoff/v1)
  ↓
packet_complete | packet_reject | packet_block
```

The executor is the **only** layer allowed to write product code, and
only inside packet edit boundaries. It must never edit product specs.

## Commands

| Command | Purpose |
| --- | --- |
| `bun run packet:create -- --task <id>` | Create a fresh ExecutionPacket from a PacketTemplate |
| `bun run packet:context -- --packet <id>` | Generate a context payload for a packet (selected refs, allowed files, test contracts) |
| `bun run packet:run -- --packet <id>` | Run the test command and record evidence (without writing product code) |
| `bun run test:run -- --packet <id>` | Run the test command and append a `test_run` event to the ledger |
| `bun run evidence:add -- --packet <id> --gate <gate_id> --status <status>` | Add an `EvidenceRecord` (must reference raw output or command) |
| `bun run handoff:validate -- --file <path>` | Validate a handoff JSON against the contract schema |
| `bun run packet:complete -- --packet <id>` | Mark a packet completed (requires evidence) |
| `bun run packet:reject -- --packet <id>` | Reject a packet |
| `bun run packet:block -- --packet <id>` | Block a packet with a Blocker record |
| `bun run execution:ready` | Report whether the executor can run a packet |
| `bun run render` | Generate `views/runs/**` Markdown |
| `bun run validate` | Validate executor outputs |

## Output

```txt
.atelier/v0/runs/ledger.jsonl
.atelier/v0/runs/evidence/
.atelier/v0/runs/handoffs/
.atelier/v0/runs/blockers/
.atelier/v0/views/runs/EXECUTION_FRONTIER.md
.atelier/v0/views/runs/EVIDENCE_LEDGER.md
.atelier/v0/views/runs/BLOCKERS.md
```

## Write authority

Executor may write product files only when all are true:

1. the file is listed in packet `allowed_files`;
2. the file is not listed in packet `forbidden_files`;
3. the packet is active;
4. the task is not stale;
5. the operation is permitted by edit boundary.

Executor must never write product specs.

## Evidence

Evidence is not prose. Evidence is runtime fact: command output, test
result, file hash, diff reference, or validated handoff. Completion
without evidence is rejected by the validator.
