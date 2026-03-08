---
name: editorial-boundary-spec
description: Repo-specific failure policy for the editorial subsystem.
summary: Captures the repo-specific failure policy for editorial reads and writes; generic boundary vocabulary and interview triggers live in harness references.
read_when:
  - clarifying responsibilities inside the editorial subsystem
  - deciding failure behavior for editorial reads and writes
  - checking repo-specific fallback behavior for editorial reads and writes
skip_when:
  - you only need the site-wide harness guard and structure rules
user-invocable: false
---

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
