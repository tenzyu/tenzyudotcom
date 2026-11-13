# ADR-001: Bootstrap Tooling and `.atelier/v0` Output Root

## Status

Accepted for v0 design.

## Decision

Tooling lives under:

```txt
.atelier-bootstrap/
```

Generated artifacts live under:

```txt
.atelier/v0/
```

Tooling and generated artifacts must not be mixed.

## Consequences

- `.atelier-bootstrap/indexer` is tooling, not output.
- `.atelier/v0/objects` is output, not tooling.
- `implementation-control` is not a root concept. It becomes transform output.
