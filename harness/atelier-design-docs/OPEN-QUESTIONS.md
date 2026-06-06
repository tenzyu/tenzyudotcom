# Open Questions

These questions should be resolved by the user/product author before implementation expands beyond the high-confidence Relation Kernel slice.

## Q1. Product app edit boundary

Should this goal allow edits under `product/apps/atelier/**`, or should implementation remain in `.atelier-bootstrap/**` and `.atelier/v0/**` only?

Default assumption in this pack: do not edit `product/apps/atelier/**` unless the coordinator receives explicit user approval or an accepted packet requires it.

## Q2. Relation acceptance workflow

Should semantic relation proposals be accepted by a manual CLI step, a reviewer step, or deterministic validators only?

Default assumption: deterministic relations can be accepted automatically; LLM-proposed semantic relations remain proposed until an explicit accept/review step.

## Q3. Code symbol anchor strategy

Should code symbol anchors use TypeScript compiler APIs, tree-sitter, or lightweight regex/heuristic extraction for v0?

Default assumption: start with dependency-light deterministic extraction and mark uncertain symbols as candidates.

## Q4. Explore scope

Should `atelier explore` CLI commands be part of this goal, or deferred until relation kernel pass?

Default assumption: CLI inspect/related/impact may be added only if cheap; GUI Explore is out of scope.

## Q5. Existing goal-plugin config values

Should existing opencode-goal-plugin numeric settings be preserved exactly?

Default assumption: preserve plugin numeric settings. This pack only removes the risky custom `command.goal` override and global agent prompt loading.
