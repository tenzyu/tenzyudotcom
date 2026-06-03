---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.reliability.content-version-normalization
title: Content Version Normalization
status: active
tags:
  - reliability
  - storage
  - versioning
  - subject:reliability
  - subject:storage
  - subject:versioning
  - kind:rule
  - criticality:high
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: avoids false conflict detection caused by newline and serialization drift
    chapter: Reliability
---

## Content Version Normalization

Content version hashes must be computed from the same normalized representation on load, compare, and save.
If one path trims trailing newlines and another does not, the system will report conflicts even when the user changed nothing.

**Avoid:**

```ts
const loadedVersion = createContentVersion(serialized.trimEnd())
const saveVersion = createContentVersion(current?.content ?? '')
```

**Prefer:**

```ts
const normalizeVersionSource = (value: string) => value.trimEnd()

const loadedVersion = createContentVersion(normalizeVersionSource(serialized))
const saveVersion = createContentVersion(
  normalizeVersionSource(current?.content ?? '')
)
```
