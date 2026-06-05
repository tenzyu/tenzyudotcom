# ADR-003: Reader and LLM Boundary

## Status

Accepted for v0 design.

## Decision

`atelier-reader` owns cheap semantic sampling, task-scoped attention assembly, and deep-read jobs.

LLM usage is allowed in reader jobs but must produce JSONL proposals accepted through schema validation.

## Non-goals

- Reader does not write product code.
- Reader does not produce runtime evidence.
- Reader does not claim full project understanding during cheap sampling.
