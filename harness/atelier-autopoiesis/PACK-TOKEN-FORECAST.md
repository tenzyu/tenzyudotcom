# Pack Token Forecast Baseline

This forecast was generated before finalizing the v2 pack. It estimates the token cost of running the goal command to completion using this file set on MiniMax M3.

It is a planning forecast, not provider telemetry. MiniMax M3 reasoning effort is not directly configurable, so reasoning tokens are estimated from observed agent behavior and controlled through prompt/contract discipline.

## Static measurements

Measured with a conservative character-based proxy:

```txt
ascii_token_proxy     = ascii_chars / 3.7
non_ascii_token_proxy = non_ascii_chars / 1.2
JSON/code adjustment  = 1.10
Markdown adjustment   = 0.95
```

```txt
v1 control pack:                     72,158 bytes  ≈ 18.97k tokens
v2 control pack:                    101,807 bytes  ≈ 26.59k tokens
current .atelier-bootstrap:         956,482 bytes  ≈ 283.83k tokens
current .atelier/v0 total:       20,195,937 bytes  ≈ 5.997M tokens
current .atelier/v0 denied huge: 19,335,468 bytes  ≈ 5.748M tokens
current .atelier/v0 small rest:     860,469 bytes  ≈ 248.94k tokens
```

Largest generated-state hazards:

```txt
.atelier/v0/edges/edges.ndjson                ≈ 2.080M tokens
.atelier/v0/anchors/source-anchors.ndjson     ≈ 2.073M tokens
.atelier/v0/indexes/by-anchor.json            ≈ 557k tokens
.atelier/v0/objects/source.ndjson             ≈ 376k tokens
.atelier/v0/objects/facts.ndjson              ≈ 324k tokens
```

Role static read surfaces after v2 responsibility split:

```txt
coordinator required bundle: ≈ 14.50k tokens
implementer required bundle: ≈ 2.96k tokens
evaluator required bundle:   ≈ 5.66k tokens
redteam required bundle:     ≈ 4.37k tokens
forecaster required bundle:  ≈ 3.69k tokens
```

The v2 pack increases static control text by about 7.6k tokens, but reduces repeated implementer canonical reads by moving implementers to work-order excerpts plus role contracts.

## Observed continuation baseline

The currently running v1 session was observed around W01 with approximately:

```txt
cached_input: 21.5M
input:        22.4M
output:       181k
reasoning:    not reported
```

For full-run accounting, this forecast treats those tokens as already consumed and estimates hidden reasoning with a wide interval.

```txt
reasoning_so_far_P50 ≈ 7M
reasoning_so_far_P80 ≈ 10M
reasoning_so_far_P95 ≈ 15M
```

If provider billing does not expose or charge reasoning separately, use input/output numbers as the hard measured component and keep reasoning as operational risk.

## Three-scenario forecast, full run including observed progress

Budget target:

```txt
TOTAL_BUDGET_ALL_DIRECTIONS = 100M tokens
```

### Scenario A: controlled

Assumptions:

```txt
- v2 role input matrix is followed.
- No broad .atelier/v0 generated-state read occurs.
- 5-7 remaining work orders.
- Evaluator/redteam cycles remain compact.
- Verification is batched into matrices.
```

```json
{
  "scenario": "controlled",
  "input":     {"p50": 40400000, "p80": 48400000, "p95": 56400000},
  "reasoning": {"p50": 12000000, "p80": 19000000, "p95": 27000000},
  "output":    {"p50": 1380000,  "p80": 2180000,  "p95": 3180000},
  "total":     {"p50": 53780000, "p80": 69580000, "p95": 86580000},
  "risk": "low_to_medium"
}
```

### Scenario B: expected

Assumptions:

```txt
- v2 controls are mostly followed.
- Some files are reread and 1-2 work orders require repair.
- No raw edges/anchors/indexes dump occurs.
- Evaluator catches at least one false completion.
```

```json
{
  "scenario": "expected",
  "input":     {"p50": 54400000, "p80": 67400000, "p95": 80400000},
  "reasoning": {"p50": 17000000, "p80": 28000000, "p95": 43000000},
  "output":    {"p50": 2580000,  "p80": 4180000,  "p95": 6180000},
  "total":     {"p50": 73980000, "p80": 99580000, "p95": 129580000},
  "risk": "medium_at_p80_high_at_p95"
}
```

### Scenario C: high-churn

Assumptions:

```txt
- Multiple failed repair loops.
- One large-state or large-test read incident occurs.
- Evaluator repeatedly rejects false completion.
- The run does not discard progress, but must compact and split work orders.
```

```json
{
  "scenario": "high_churn",
  "input":     {"p50": 70400000,  "p80": 87400000,  "p95": 104400000},
  "reasoning": {"p50": 27000000,  "p80": 46000000,  "p95": 70000000},
  "output":    {"p50": 4180000,   "p80": 7180000,   "p95": 10180000},
  "total":     {"p50": 101580000, "p80": 140580000, "p95": 184580000},
  "risk": "breach"
}
```

## Decision

The v2 pack is acceptable for continuation only if the run follows the controlled/expected path. The expected P80 is approximately 99.6M, which is inside the 100M budget only narrowly. Therefore the pack requires:

```txt
1. no broad .atelier/v0 reads;
2. role-specific read surfaces;
3. compact checkpoints before subagent dispatch;
4. token forecast before phase-final file acceptance;
5. work-order splitting when P80 forecast exceeds 90% of remaining budget;
6. batch verification instead of repeated command probes;
7. JSON reports without raw logs/diffs.
```

If high-churn behavior starts, the coordinator must not keep pushing the same session. It must compact state, split the work, and rerun the forecast. This preserves implementation progress without preserving a poisoned transcript.
