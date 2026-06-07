# Subagent Execution Contract

This contract exists because useful agents still waste context when their information gathering is unbounded.
The goal is not to minimize tool calls absolutely. The goal is to maximize evidence per token and prevent
uncontrolled state synchronization.

## General execution shape

Every subagent must follow this shape unless its role contract is stricter:

```txt
1. Contract extraction
   Extract required files, commands, tests, outputs, negative controls, and stop rules from the work order.

2. Inventory phase
   Use one batched command to identify relevant files, sizes, key symbols, package scripts, and command entrypoints.
   Do not issue many separate ls/find/stat calls.

3. Targeted read phase
   Use rg/sed/head/jq line slices. Full-file read is allowed only for small files or role contracts.

4. Batch implementation or reproduction
   Write related changes together. For redteam/evaluator work, use table-driven repro scripts instead of one-off scripts.

5. Failure triage
   First classify all failures. Do not immediately patch the first failure if more failures are visible.

6. Patch batch
   Apply logically grouped edits.

7. Single verification matrix
   Run required tests/checks/CLI probes in one compact command where possible. Return a JSON matrix.

8. Compact report
   Return commands_run, evidence, files_changed, remaining_defects. Do not paste raw logs or diffs.
```

## Default tool budget

```txt
read calls:         <= 12 per subagent
full-file reads:    <= 5 per subagent; 0 for generated state
bash calls:         <= 20 per implementer; <= 12 per evaluator/redteam
write/edit calls:   unconstrained, but batch same-file edits
test runs:          <= 4 before failure triage/reset
final verification: 1 matrix command when possible
```

If a work order needs more, the subagent must return `status: partial` with a continuation work order instead of
expanding the context silently.

## Read policy

Prefer:

```bash
rg -n "symbol|command|schema|test" <paths>
sed -n '120,220p' <file>
jq '.scripts' package.json
wc -c <file>; wc -l <file>
```

Avoid:

```bash
cat large-file
cat .atelier/v0/**/*.ndjson
full read of generated indexes
full read of long test files just to learn fixture style
repeated package.json/root config reads
```

## Report discipline

All subagent reports must start with JSON. Human explanation after JSON must be short and must not repeat raw evidence.

A valid report is evidence-oriented:

```json
{
  "schema": "atelier.subagent-report/v1",
  "status": "completed|partial|blocked",
  "work_order_id": "wo:<id>",
  "commands_run": [],
  "evidence": [],
  "files_changed": [],
  "remaining_defects": [],
  "token_notes": {
    "large_reads_avoided": [],
    "budget_risk": "none|low|medium|high"
  }
}
```
