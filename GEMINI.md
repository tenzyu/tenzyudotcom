# GEMINI.md

## Repository instruction for LLM agents

Do not rely on prior chat context.

Before non-trivial work, identify the task scope from the requested paths, files, and intent. Prefer local control files and explicit repository instructions over broad manual discovery.

External LLM runners own task execution and may edit the repository directly, but they must follow the relevant local control surface before editing.

## Deprecated Atelier context planning

Do not use legacy Atelier context planning for Atelier implementation work.

Do not run this as the default entrypoint for Atelier work:

```bash
atelier context plan --workflow workflow.isolated-run --role role.core.implementer --path . --intent "<request>"
```

The current Atelier implementation/control surface is not reliable enough to govern its own development.

For Atelier implementation work, use the Pre-Atelier Bootstrap Harness instead.

## Atelier bootstrap scope

If your task touches any of these paths, you are in Atelier bootstrap scope:

```txt
harness/knowledge/implementation-control/atelier/**
harness/bootstrap/atelier-build/**
product-specs/atelier/**
```

When in Atelier bootstrap scope, read these files before editing:

```txt
harness/bootstrap/atelier-build/CONTRACT.md
harness/bootstrap/atelier-build/NEXT_ACTION.md
harness/bootstrap/atelier-build/REVIEW_LEDGER.md
harness/bootstrap/atelier-build/ACCEPTANCE.md
harness/bootstrap/atelier-build/ALLOWED_PATHS.txt
harness/bootstrap/atelier-build/FORBIDDEN_PATHS.txt
harness/bootstrap/atelier-build/GENERATED_PATHS.txt
```

If any of these files are missing, create or repair the bootstrap harness first.

Do not proceed with Atelier implementation-control work until the bootstrap files exist.

## Atelier bootstrap rules

For Atelier bootstrap scope:

- do not advance the implementation DAG unless `NEXT_ACTION.md` explicitly permits it;
- do not edit generated Atelier artifacts directly;
- do not patch generated output by hand;
- if generated output is wrong, fix the mechanism that produced or accepted it;
- do not search broadly unless `NEXT_ACTION.md` explicitly permits it;
- do not edit paths listed in `FORBIDDEN_PATHS.txt`;
- only edit paths allowed by `ALLOWED_PATHS.txt`, unless `NEXT_ACTION.md` explicitly expands the allowed surface;
- do not declare completion while `REVIEW_LEDGER.md` has open issues;
- do not declare readiness while `ACCEPTANCE.md` has unchecked conditions.

Allowed mechanism changes include:

```txt
source spec parser
compiler rule
schema
generator
readiness predicate
fixture
validation command
agent instruction
acceptance condition
```

## Reviewer findings for Atelier work

Reviewer findings must be converted into `REVIEW_LEDGER.md` entries.

Do not resolve reviewer findings with apology-driven local patches.

Each issue should track:

```txt
id:
status: open | closed
class:
evidence:
required_fix:
verification:
```

A fix is incomplete until the bad state is either mechanically prevented, mechanically detected, or explicitly recorded as unresolved.

## Validation

Before claiming completion, run the relevant project check when the project is known and the command is available.

Preferred form:

```bash
bun nx run <project>:check
```

If the project is unknown, Bun is unavailable, or the command cannot be run in the current environment, report that explicitly instead of claiming it passed.

For Atelier bootstrap scope, also verify:

```txt
- required bootstrap files exist;
- no generated Atelier artifact was directly edited;
- REVIEW_LEDGER.md has no open issue blocking the current task;
- ACCEPTANCE.md conditions for the current task are satisfied or explicitly reported as unsatisfied.
```

## Adapter details

Canonical adapter details live in:

```txt
harness/adapters/root/AGENTS.md
```

Use that file only when the task concerns root adapter behavior.

Do not let adapter instructions override the Atelier bootstrap rules for Atelier implementation work.

## Final report format

For Atelier bootstrap scope, final reports must use this format:

```txt
Changed files:
- ...

Checks:
- ...

Open issues:
- ...

Generated files directly edited:
- yes/no

Acceptance:
- pass/fail
- reason

Next action:
- ...
```
