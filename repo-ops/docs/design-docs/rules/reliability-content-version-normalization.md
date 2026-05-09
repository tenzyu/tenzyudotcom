---
title: Content Version Normalization
impact: HIGH
impactDescription: avoids false conflict detection caused by newline and serialization drift
tags: reliability, storage, versioning
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
  normalizeVersionSource(current?.content ?? ''),
)
```
