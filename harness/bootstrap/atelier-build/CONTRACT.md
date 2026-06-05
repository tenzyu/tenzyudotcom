# CONTRACT.md

## Purpose

This harness governs how LLM agents build Atelier. It is not Atelier itself.

## Scope

In bootstrap scope when a task touches any of:

```txt
harness/knowledge/implementation-control/atelier/**
harness/bootstrap/atelier-build/**
harness/knowledge/product-specs/atelier/**
product-specs/atelier/**
```

## Hard rules

- Generated files must not be edited directly.
- Wrong generated output must be fixed by changing the mechanism that produced or accepted it, not by patching the output.
- Allowed mechanism changes: source spec parser, compiler rule, schema, generator, readiness predicate, fixture, validation command, agent instruction, acceptance condition.
- Do not advance the implementation DAG unless `NEXT_ACTION.md` explicitly permits it.
- Do not edit paths listed in `FORBIDDEN_PATHS.txt`.
- Only edit paths allowed by `ALLOWED_PATHS.txt` unless `NEXT_ACTION.md` explicitly expands the allowed surface.
- Do not search broadly unless `NEXT_ACTION.md` explicitly permits it.
- Do not rely on prior chat context.

## Read order

Before any edit in bootstrap scope, read in this order:

```txt
harness/bootstrap/atelier-build/CONTRACT.md
harness/bootstrap/atelier-build/NEXT_ACTION.md
harness/bootstrap/atelier-build/REVIEW_LEDGER.md
harness/bootstrap/atelier-build/ACCEPTANCE.md
harness/bootstrap/atelier-build/ALLOWED_PATHS.txt
harness/bootstrap/atelier-build/FORBIDDEN_PATHS.txt
harness/bootstrap/atelier-build/GENERATED_PATHS.txt
```

## Reviewer findings

All reviewer findings must be recorded in `REVIEW_LEDGER.md` using the format defined in that file. Apology-driven local patches are forbidden.

## Completion

Completion is forbidden while:

- `REVIEW_LEDGER.md` has any open issue blocking the current task; or
- `ACCEPTANCE.md` has any unchecked condition for the current task.
