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
body_refs:
  - ./editorial-boundary-spec/body.md
user-invocable: false
---

./editorial-boundary-spec/body.md
