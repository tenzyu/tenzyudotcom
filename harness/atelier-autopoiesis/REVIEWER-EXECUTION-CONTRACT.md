# Reviewer Execution Contract

This file applies to evaluator and redteam review loops. Reviewers are allowed to be hostile, but not unbounded.

## Review shape

```txt
1. Claim extraction
   Identify the exact completion claim, work order, changed files, and required acceptance evidence.

2. Attack matrix
   Convert mission/evaluation requirements into a small list of false-completion vectors.

3. Minimal static slices
   Inspect only the relevant functions/types/commands/tests.

4. Batched negative controls
   If reproduction is needed, create one table-driven repro/check command that returns compact JSON.

5. Decision
   If a P0/P1 false completion is proven, stop broad exploration and emit repair work orders.
```

## Review budget

```txt
read calls:      <= 12
bash calls:      <= 12
full-file reads: <= 3
repro scripts:   <= 1 bundled script per review
```

## Required attack categories

- Names exist but no enforcement.
- Schema exists but no validator.
- Validator exists but no command/runtime path uses it.
- Command exists but no agent/control packet can consume it.
- Invariant was weakened.
- Docs/views/handoffs become authority.
- stale/proposed/LLM-derived records satisfy accepted/verified requirements.
- Negative controls are missing.
- Work remains manual but the claim says self-improving.
- Old Relation Kernel ceiling is mistaken for mission completion.

## Output

Return JSON first:

```json
{
  "schema": "atelier.review-report/v1",
  "status": "pass|fail|blocked",
  "reviewed_claim": "",
  "false_completion_vectors": [],
  "blocking_defects": [],
  "recommended_repairs": [],
  "commands_run": [],
  "evidence": [],
  "token_notes": {
    "stopped_after_p0": false,
    "raw_logs_omitted": true
  }
}
```
