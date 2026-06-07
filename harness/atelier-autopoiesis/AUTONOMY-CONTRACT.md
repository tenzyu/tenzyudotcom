# Atelier Autopoiesis Autonomy Contract

## Role of the human

The human runs OpenCode and decides product-author questions only when the runtime cannot infer authority from the mission, existing repository state, or explicit policies. The human does not choose implementation steps, prioritize routine repairs, or manually translate the mission into tickets.

## Role of the coordinator

The coordinator owns convergence. It repeatedly:

```txt
compile mission -> evaluate implementation -> derive missing capability findings -> dispatch patches -> evaluate again -> continue
```

It does not stop after producing a plan. It does not ask for sequencing. It does not request permission for obvious implementation work inside allowed boundaries.

## Role of implementers

Implementers patch the repository. They must bind every code change to one or more evaluator findings, capability ids, tests/checks, and affected runtime artifacts.

## Role of evaluator

The evaluator is hostile to false completion. It is allowed to fail even when all tests pass, if the implementation does not satisfy the semantic-control-plane mission.

## Blocking rules

A run may block only for:

```txt
B1: A product-author value judgment cannot be derived from the mission.
B2: Required local tooling is unavailable and static inspection cannot proceed.
B3: The repository is missing files necessary to make progress.
B4: Continuing would require changing forbidden user/private/secrets files.
B5: A safety or legal boundary would be crossed.
```

The following are not blockers:

```txt
N1: More implementation work is required.
N2: The first patch failed.
N3: Existing architecture is partial or messy.
N4: The evaluator found many defects.
N5: Current docs are narrower than the mission.
N6: A better design is obvious but not yet implemented.
```

## Prose-output ban for active implementation

When running under the goal plugin, agents must prefer repository edits, generated work artifacts, command output, and structured reports over essays. A human-readable summary is allowed only after producing artifacts or a reviewer/evaluator report.
