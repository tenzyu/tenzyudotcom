# Editorial Boundary Spec

## Scope

`source / content / contract / assemble / storage` の一般語彙は
`docs/harness/references/tools.md` を正とする。

この文書には、この repo の editorial subsystem に固有な
failure policy だけを残す。

## Failure Policy

- not-found -> fallback 可
- invalid-data -> fail closed
- outage / token misconfig -> fail closed
- save conflict -> reject and reload
