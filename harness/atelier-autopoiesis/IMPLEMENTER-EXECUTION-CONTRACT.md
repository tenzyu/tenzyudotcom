# Implementer Execution Contract

This file is the runtime implementer contract. It is intentionally narrower than the mission. The coordinator is
responsible for compiling mission semantics into a concrete work order.

## Input requirements

An implementer work order must include:

```json
{
  "schema": "atelier.autopoiesis-work-order/v2",
  "work_order_id": "wo:<id>",
  "capability_ids": [],
  "objective": "",
  "mission_excerpt": [],
  "capability_excerpt": [],
  "allowed_files": [],
  "forbidden_files": [],
  "read_surface": {
    "preferred_symbols": [],
    "required_file_slices": [],
    "full_read_allowlist": [],
    "generated_state_policy": "query_or_summary_only"
  },
  "required_runtime_behavior": [],
  "required_negative_controls": [],
  "required_commands": [],
  "acceptance_evidence": [],
  "token_budget": {
    "input_soft_cap": 3000000,
    "output_soft_cap": 350000,
    "test_run_cap": 4,
    "full_file_read_cap": 5
  }
}
```

If `mission_excerpt`, `capability_excerpt`, or `read_surface` are missing, return `partial` with `needs_context`.
Do not compensate by reading the entire mission or whole repository.

## Implementation constraints

- Implement exactly the work order.
- Prefer adding executable primitives: types, schemas, validators, commands, queries, fixtures, tests.
- Do not narrow the mission to fit existing code.
- Do not mutate generated `.atelier/v0/**` records by hand as a substitute for behavior.
- Do not mark LLM-derived state accepted/verified without promotion policy.
- Do not treat generated views or handoffs as authority.
- Do not weaken validators to pass.

## Reading constraints

Start with inventory:

```bash
rg -n "<symbols from read_surface>" <allowed roots>
```

Then use `sed -n` slices. Full-file read is allowed only when the file is small or listed in `full_read_allowlist`.

## Failure handling

When tests fail:

```txt
1. capture compact failure matrix
2. classify all failures by cause
3. patch in one batch
4. rerun one matrix
```

Do not run the same failing command repeatedly without changing the failure hypothesis.

## Output

Return JSON first:

```json
{
  "schema": "atelier.autopoiesis-implementer-report/v2",
  "work_order_id": "wo:<id>",
  "status": "completed|partial|blocked",
  "capability_ids": [],
  "files_changed": [],
  "commands_run": [],
  "commands_not_run": [],
  "runtime_evidence": [],
  "negative_controls_added": [],
  "remaining_defects": [],
  "needs_context": [],
  "token_notes": {
    "full_file_reads": 0,
    "test_runs": 0,
    "budget_risk": "none|low|medium|high"
  }
}
```
