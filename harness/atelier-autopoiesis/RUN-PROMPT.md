# OpenCode Run Prompt

Paste this into OpenCode from repository root after applying the pack:

```txt
/goal @atelier-autopoiesis-coordinator Execute @harness/atelier-autopoiesis/GOAL-ATELIER-AUTOPOIESIS.md against the current repository. Do not stop at analysis. Continue by dispatching implementation and evaluator agents until the evaluator returns pass or a true product-author decision is blocked. The target is not an MVP and not the old Relation Kernel ceiling; implement the semantic control plane and self-improvement runtime described by MISSION.md. If a capability is missing, generate a work order and patch it. If a patch fails, evaluate and repair. Only the evaluator can authorize completion. Preserve existing implementation progress. Before any phase-final file set is accepted, run the token forecast phase from TOKEN-FORECAST-SPEC.md. Treat the total perfect-completion budget as 100M tokens on MiniMax M3; reasoning effort is prompt-controlled only. Do not broad-read .atelier/v0 generated state; use compact inventory, slices, summaries, and runtime queries.
```
