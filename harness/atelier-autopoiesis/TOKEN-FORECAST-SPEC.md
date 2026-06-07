# Token Forecast Spec

This spec defines the mandatory forecast phase before accepting generated file sets or completing the goal.
It is not a reason to stop implementing. It is the mechanism that keeps a 100M token run from silently turning into
an unbounded state-synchronization run.

## When to run

The coordinator must request a token forecast:

```txt
1. before the first implementation dispatch after resuming a swollen session;
2. before accepting any generated file set as phase-complete;
3. after any cycle whose telemetry exceeds 6M input or 750k output;
4. before emitting `[goal:complete]`;
5. whenever evaluator asks for a broad repository survey.
```

## Inputs

The forecaster uses only compact inputs:

```txt
- current provider telemetry if available: input, cached_input, reasoning, output
- current checkpoint: active work order, completed work, failed checks, remaining P0/P1
- pack file inventory: path, bytes, lines, approximate tokens
- repository surface inventory: path, bytes, lines for candidate roots
- agent input matrix and execution contracts
- expected number of remaining work orders/evaluator cycles
```

Do not read source semantics just to forecast. Use `wc -c`, `wc -l`, `find`, and existing compact reports.

## Static token proxy

MiniMax M3's exact tokenizer is not available inside the runner. Use a conservative proxy:

```txt
ascii_token_proxy     = ascii_chars / 3.7
non_ascii_token_proxy = non_ascii_chars / 1.2
json_code_markup_adj  = 1.10 for dense JSON/NDJSON/code
markdown_adj          = 0.95 for prose markdown
```

Report the proxy and confidence range. Default tokenizer uncertainty:

```txt
P50 = proxy
P80 = proxy * 1.25
P95 = proxy * 1.45
```

For generated NDJSON/index state, use wider uncertainty:

```txt
P50 = proxy
P80 = proxy * 1.40
P95 = proxy * 1.70
```

## Behavioral model

Estimate final completion in three scenarios.

```txt
Scenario A: controlled
  role input matrix obeyed, no broad generated-state read, batch verification, compact reports

Scenario B: expected
  some rereads, 1-2 failed work-order repairs, evaluator/redteam cycles repeat, but generated state is not dumped

Scenario C: high-churn
  several repair loops, one large-state or large-test read incident, repeated evaluator failure, but run still respects 100M ceiling
```

Use these multipliers unless measured telemetry suggests better values:

```txt
controlled reasoning = input * 0.18..0.35
expected reasoning   = input * 0.25..0.50
high-churn reasoning = input * 0.35..0.70

controlled output = input * 0.04..0.09
expected output   = input * 0.05..0.12
high-churn output = input * 0.06..0.16
```

If provider telemetry reports actual reasoning tokens, replace the multiplier with observed ratios.

## Required forecast output

Return JSON first:

```json
{
  "schema": "atelier.token-forecast/v1",
  "forecast_at": "ISO-8601",
  "model": "minimax-m3",
  "reasoning_effort_control": "prompt-only",
  "budget_total": 100000000,
  "telemetry_so_far": {
    "input": 0,
    "cached_input": 0,
    "reasoning": null,
    "output": 0
  },
  "remaining_budget_estimate": 0,
  "static_surfaces": [],
  "scenarios": [
    {
      "name": "controlled|expected|high_churn",
      "input_p50": 0,
      "input_p80": 0,
      "input_p95": 0,
      "reasoning_p50": 0,
      "reasoning_p80": 0,
      "reasoning_p95": 0,
      "output_p50": 0,
      "output_p80": 0,
      "output_p95": 0,
      "total_p50": 0,
      "total_p80": 0,
      "total_p95": 0,
      "assumptions": []
    }
  ],
  "risk": "low|medium|high|breach",
  "required_mitigation": []
}
```

## Decision rule

Use P80 as the operating number.

```txt
low:    P80 total <= 70% of remaining budget
medium: P80 total <= 90% of remaining budget
high:   P80 total <= 100% of remaining budget
breach: P80 total > remaining budget
```

For `high` or `breach`, do not ask the user for decomposition. Split work orders, reduce read surface, compact state,
and rerun the forecast.
