<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Control Graph

- total nodes: 7
- total edges: 27

## Nodes

- PHASE_0 (PHASE_0)
- PHASE_0.5 (PHASE_0.5)
- PHASE_1 (PHASE_1)
- PHASE_2 (PHASE_2)
- PHASE_3 (PHASE_3)
- PHASE_4 (PHASE_4)
- PHASE_5 (PHASE_5)

## Edges (sample)

| From | To | Kind |
| | | |
| VG-1-SCOPE-AND- | PHASE_0 | gated_by |
| VG-2-CHECK-REGI | PHASE_0 | gated_by |
| VG-8-COMPLETION | PHASE_0 | gated_by |
| PHASE_0 | PHASE_0.5 | depends_on |
| VG-1-SCOPE-AND- | PHASE_0.5 | gated_by |
| VG-2-CHECK-REGI | PHASE_0.5 | gated_by |
| VG-8-COMPLETION | PHASE_0.5 | gated_by |
| PHASE_0.5 | PHASE_1 | depends_on |
| VG-1-SCOPE-AND- | PHASE_1 | gated_by |
| VG-2-CHECK-REGI | PHASE_1 | gated_by |
| VG-8-COMPLETION | PHASE_1 | gated_by |
| PHASE_1 | PHASE_2 | depends_on |
| VG-1-SCOPE-AND- | PHASE_2 | gated_by |
| VG-2-CHECK-REGI | PHASE_2 | gated_by |
| VG-8-COMPLETION | PHASE_2 | gated_by |
| PHASE_2 | PHASE_3 | depends_on |
| VG-1-SCOPE-AND- | PHASE_3 | gated_by |
| VG-2-CHECK-REGI | PHASE_3 | gated_by |
| VG-8-COMPLETION | PHASE_3 | gated_by |
| PHASE_3 | PHASE_4 | depends_on |
| VG-1-SCOPE-AND- | PHASE_4 | gated_by |
| VG-2-CHECK-REGI | PHASE_4 | gated_by |
| VG-8-COMPLETION | PHASE_4 | gated_by |
| PHASE_4 | PHASE_5 | depends_on |
| VG-1-SCOPE-AND- | PHASE_5 | gated_by |
| VG-2-CHECK-REGI | PHASE_5 | gated_by |
| VG-8-COMPLETION | PHASE_5 | gated_by |
