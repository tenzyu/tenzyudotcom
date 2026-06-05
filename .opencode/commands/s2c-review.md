---
description: Review and force-complete the Spec-to-Control Compiler readiness work
agent: spec-control-reviewer
---

---

# REVIEW GOAL

You are reviewing `harness/knowledge/implementation-control/atelier` after an implementation attempt.

Your job is not to be friendly.
Your job is to determine whether the workspace now behaves like a strict
Spec-to-Implementation-Control Compiler and readiness auditor.

Do not advance product DAG nodes.
Do not implement DAG-04 or later.
Do not modify product specs.
Do not modify the main Atelier CLI.

You must verify whether the current implementation satisfies the expected final behavior below. If it does not, you must produce exact blocking defects and exact next repair commands. If you have write permissions, repair the defects and repeat the review loop until either:

1. `bun run ready` passes honestly, or
2. the remaining blockers are explicitly represented as machine-readable defects that cannot be safely resolved without user/product-author clarification.

Do not claim completion from prose.

# EXPECTED FINAL BEHAVIOR

The final system must behave as follows.

## Core behavior

`product-specs/atelier` is compiled into a machine-queryable implementation-control plane under:

```txt
harness/knowledge/implementation-control/atelier/canonical/**
harness/knowledge/implementation-control/atelier/state/**
```

Generated human-readable files live under:

```txt
harness/knowledge/implementation-control/atelier/views/**
```

Generated views are not source of truth.

The system must support this lifecycle:

```txt
product-specs/atelier
  -> Spec-to-Control Compiler
  -> canonical/** + state/**
  -> bun run ready
  -> generated views
  -> long-run execution by CLI + subagents
```

## Hard invariants

Verify all invariants.

- Product specs are untouched.
- Main Atelier CLI is untouched.
- `canonical/**` and `state/**` are active truth.
- `views/**` are generated and not edited directly.
- Legacy root docs are not active truth.
- LLM-derived records enter only through `llm:jobs` and `llm:accept`.
- Mutating commands append ledger events.
- Read-only commands do not mutate state unless explicitly called with `--record`.
- `bun run ready` fails closed.
- `ready_to_implement: true` is not required for this task.
- A strict `not_ready` report is acceptable if it exposes real defects.
- Validators must not be weakened to make the report green.

# REQUIRED AUDIT STEPS

Run from:

```bash
cd harness/knowledge/implementation-control/atelier
```

Run or statically inspect the following. If Bun is unavailable, report that explicitly and do not claim command success.

```bash
bun run validate
bun run validate:coverage
bun run validate:graph
bun run validate:fixtures -- --summary
bun run validate:tests
bun run ready
```

Also inspect:

```txt
package.json
scripts/cli.ts
schemas/**
canonical/**
state/**
views/**
```

# REVIEW CHECKLIST

## A. CLI surface

Verify that the implementation-control local Bun workspace exposes required capabilities.

Required capabilities:

```txt
inspect:repo
inspect:workspace
inspect:tests
inspect:docs

derive:bootstrap
derive:sample
derive:brief
derive:deep
derive:control
derive:audit

control:generate
control:link
control:validate
control:render

ready

legacy:audit
legacy:promote
legacy:quarantine
legacy:cleanup

packet:create
packet:context
packet:dispatch
packet:complete
packet:reject
packet:block

subagent:validate-handoff

evidence:add
evidence:list
evidence:verify

status
frontier
resume
complete
```

Existing command names may be accepted only if behavior is equivalent and documented in generated views.

Fail if a required behavior exists only as prose.

## B. Phase 0 bootstrap

Verify that zero/low-token bootstrap exists and mechanically collects:

```txt
file tree
package.json facts
workspace config
scripts
tsconfig
project.json
test files
docs paths
git status
recent commits when available
naming patterns
file sizes
extension histogram
source / test / doc ratios
```

Required outputs:

```txt
canonical/bootstrap-facts.json
canonical/repository-shape.json
views/BOOTSTRAP_FACTS.md
```

Fail if hypotheses are not marked with confidence and evidence.

## C. Phase 1 cheap semantic sampling

Verify that cheap sampling reads only representative product-spec files by default:

```txt
product-specs/atelier/README.md
product-specs/atelier/Ideal.md
product-specs/atelier/contract.md
product-specs/atelier/ROADMAP.md
product-specs/atelier/SURFACES.md
```

Required outputs:

```txt
canonical/project-brief.yaml
views/PROJECT_BRIEF.md
```

The brief must distinguish:

```txt
observed_facts
hypotheses
confidence
source_refs
unresolved_questions
```

Fail if the brief claims full understanding.

## D. Phase 2 deep product-spec read

Verify all product-spec sections are discovered from the compiled section index.

Do not hard-code the section count. The observed count may be 407, but the validator must derive the count from `canonical/source-sections.ndjson`.

Required outputs:

```txt
canonical/source-sections.ndjson
canonical/source-classifications.ndjson
canonical/assertions.ndjson
canonical/definitions.ndjson
canonical/non-goals.ndjson
canonical/risks.ndjson
canonical/open-questions.ndjson
views/SPEC_DERIVATION_COVERAGE.md
views/SOURCE_CLASSIFICATION.md
views/ASSERTION_REGISTRY.md
views/NON_GOAL_REGISTRY.md
```

Each source section must be classified as exactly one of:

```txt
assertion_source
definition_source
invariant_source
non_goal_source
example_source
rationale_source
positioning_source
roadmap_future
duplicate_or_covered
out_of_scope_for_active_dag
```

Fail if any section is unclassified.

Before LLM extraction, deterministic preclassification must use signals such as:

```txt
file path
heading path
modal verbs
schema keywords
table/list/code density
known source type
duplicate section hashes
```

LLM jobs should be generated only for likely normative, ambiguous, or semantically difficult sections.

Fail if every section is sent to LLM by default.

## E. Provenance

Every canonical record that affects readiness must declare one of:

```txt
deterministic_fact
llm_extracted
legacy_promoted
manual_control_record
```

For assertions, verify:

```txt
source_section_id
provenance_kind
provenance_ref
extraction_status
```

Fail if legacy-promoted records are indistinguishable from product-spec-derived records.

## F. Active scope

Verify active scope exists as source of truth:

```txt
canonical/scope.yaml
```

Verify generated view exists:

```txt
views/ACTIVE_SCOPE.md
```

`canonical/scope.yaml` must define which product-spec sections, assertions, DAG nodes, gates, fixtures, routes, packet templates, blockers, and evidence requirements are evaluated by:

```bash
bun run ready
```

Fail if active scope is inferred from generated views.

Fail if active scope is stored only in `state/**`.

Fail if active scope references nonexistent DAG nodes.

Fail if DAG-11..DAG-53 are silently omitted instead of explicitly marked as future, carryover, archived, or out_of_scope_for_active_dag with reason and provenance.

Minimum accepted scope schema:

```yaml
schema: atelier.active-scope/v1
scope_id: string
generated_at: string

included_dag_nodes:
  - dag_node_id: string
    status: active
    reason: string
    provenance_kind: deterministic_fact | llm_extracted | legacy_promoted | manual_control_record
    provenance_ref: string

excluded_dag_nodes:
  - selector: string
    status: future | carryover | archived | out_of_scope_for_active_dag
    reason: string
    required_for_ready: boolean
    provenance_kind: deterministic_fact | llm_extracted | legacy_promoted | manual_control_record
    provenance_ref: string

included_source_sections:
  mode: derived_from_routes_and_assertions | explicit

excluded_source_classifications:
  - roadmap_future
  - positioning_source
  - duplicate_or_covered
  - out_of_scope_for_active_dag

ready_policy:
  fail_if_missing_scope: true
  fail_if_scope_references_missing_dag_nodes: true
  fail_if_active_node_missing_derivation_coverage: true
  fail_if_active_truth_depends_on_legacy_root_docs: true
```

## G. Control plane generation

Verify these exist or are generated/validated:

```txt
canonical/scope.yaml
canonical/control-graph.yaml
canonical/dag.yaml
canonical/gates.yaml
canonical/fixtures.yaml
canonical/routes.yaml
canonical/edit-boundaries.yaml
canonical/roles.yaml
canonical/validation-profiles.yaml
canonical/packet-templates.yaml
```

Every dispatchable DAG node must have:

```txt
source_refs
assertions
allowed_files
forbidden_files
required_gates
required_fixtures or explicit no-fixture reason
validation_profile
evidence_expectations
subagent_role
completion_criteria
```

Fail if this information only appears in prose.

## H. Ready audit

`bun run ready` must check all 20 items below and fail closed:

1. product specs are dirty
2. any source section is unclassified
3. any normative section lacks assertion or explicit non-dispatch reason
4. any active DAG node lacks source refs
5. any active DAG node lacks assertions
6. any active DAG node lacks gates
7. any active DAG node lacks allowed_files
8. any active DAG node lacks forbidden_files
9. any active DAG node lacks validation_profile
10. any ready frontier node has non-executable required fixtures
11. unresolved P0/P1 blocker in active scope
12. active truth depends on legacy root docs
13. generated views are stale
14. packet generation fails for any frontier node
15. packet validation fails for any frontier node
16. graph is cyclic
17. parent / subagent protocol incomplete
18. resume protocol cannot recover without broad context
19. evidence records cannot be written by CLI
20. completion can be claimed without evidence / gates

Required output:

```txt
state/ready-report.json
views/READY_TO_IMPLEMENT_REPORT.md
```

Ready report schema:

```txt
atelier.ready-report/v1
```

Required fields:

```txt
status: ready | not_ready
errors[]
warnings[]
active_scope[]
legacy_truth_refs[]
unclassified_sections[]
missing_gate_nodes[]
missing_packet_nodes[]
ready_to_implement: boolean
```

Fail if `bun run ready` prints only prose.

Fail if `ready_to_implement: true` is claimed while errors remain.

Fail if the validator suppresses, downgrades, or ignores real defects.

## I. Legacy cleanup

Verify legacy material is classified as one of:

```txt
legacy_archive
legacy_promoted
legacy_blocking
legacy_dead
```

`legacy_blocking` must make ready fail.

Allowed:

```txt
state/legacy/** as provenance
archive-final/** as history
generated view links to archive for history
```

Forbidden:

```txt
canonical records using legacy root docs as active behavioral source
packet required source sections pointing to archive-only docs
gates deriving command or purpose from legacy root docs
routes depending on legacy root docs
generated views treated as source-of-truth
```

## J. Subagent handoff

Verify:

```bash
bun run subagent:validate-handoff <file>
```

The handoff schema is:

```txt
atelier.subagent-handoff/v1
```

Required JSON shape:

```json
{
  "run_id": "PKT-DAG-04-...",
  "dag_node_id": "DAG-04",
  "files_changed": ["..."],
  "tests_written": ["..."],
  "vg_results": {
    "VG-005": "passed"
  },
  "evidence_paths": ["..."],
  "blockers": [],
  "summary": "Implemented DAG-04 with 5 tests, all green."
}
```

Rules:

- JSON is required.
- `summary` is optional.
- When present, `summary` length must be ≤ 80 characters.
- `blockers` is required and may be empty.
- `vg_results` keys must be gate ids.
- `vg_results` values must be one of `passed`, `failed`, `skipped`, `blocked`.
- `files_changed` must be inside parent packet `allowed_files`.
- `tests_written` must be inside parent packet `allowed_files`.
- prose body is rejected.
- markdown sections are rejected.
- extra narrative fields are rejected.

## K. Generated views

Required generated views:

```txt
views/BOOTSTRAP_FACTS.md
views/PROJECT_BRIEF.md
views/SPEC_DERIVATION_COVERAGE.md
views/SOURCE_CLASSIFICATION.md
views/ASSERTION_REGISTRY.md
views/NON_GOAL_REGISTRY.md
views/ACTIVE_SCOPE.md
views/CONTROL_GRAPH.md
views/READY_TO_IMPLEMENT_REPORT.md
views/LEGACY_AUDIT.md
views/LONG_RUN_PROTOCOL.md
```

All must carry:

```md
<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->
```

Fail if any required view is hand-written, stale, or missing.

# REVIEW OUTPUT CONTRACT

Return a machine-oriented review.

Do not return only prose.

Use this structure:

```json
{
  "schema": "atelier.spec-control-review/v1",
  "status": "pass | fail",
  "ready_to_implement": false,
  "commands_run": [],
  "commands_not_run": [],
  "blocking_defects": [
    {
      "defect_id": "SCR-001",
      "severity": "P0 | P1 | P2",
      "blocking": true,
      "affected_record": "path or id",
      "reason": "specific reason",
      "recommended_command_or_next_action": "exact command or patch target"
    }
  ],
  "warnings": [],
  "verified_invariants": [],
  "product_specs_touched": false,
  "main_atelier_cli_touched": false,
  "legacy_active_truth_found": false,
  "next_action": "repair | rerun_ready | stop_for_user"
}
```

If you have write permission and `blocking_defects` is non-empty, do not stop after reporting. Repair defects, rerun the relevant commands, and return an updated review.

Continue until the review is pass or until the remaining blockers require user/product-author clarification.

# STOP CONDITIONS

You may stop only when one of these is true:

1. `bun run ready` passes and review status is `pass`.
2. `bun run ready` fails but every remaining failure is represented as a machine-readable blocker with exact affected records and exact next action.
3. Product-spec ambiguity requires user/product-author decision.
4. Tooling is unavailable, and you have reported exactly which commands could not run.

Do not stop because the output is long.
Do not stop after creating only views.
Do not stop after a partial CLI surface.
Do not stop with “looks good”.
