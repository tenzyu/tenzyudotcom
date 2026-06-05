# ADR-004: md-to-code Transform

## Status

Accepted for v0 design.

## Decision

The first transform target is `md-to-code`.

`implementation-control` is not the root concept. It is represented through md-to-code transform outputs such as implementation tasks, test contracts, edit boundaries, packet templates, and evidence expectations.

## Consequences

Transformer does not write code. Executor consumes transform outputs and writes code through packets.
