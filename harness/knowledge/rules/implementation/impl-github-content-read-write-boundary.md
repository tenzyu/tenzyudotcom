---
schema: harness/v1
kind: knowledge
knowledge_type: rule
id: knowledge.rule.implementation.github-content-read-write-boundary
status: active
title: GitHub Content Read Write Boundary
impact: HIGH
impactDescription: prevents stale reads, false conflicts, and excessive GitHub API traffic
tags: storage, github, cache, editor
chapter: Implementation
---

## GitHub Content Read Write Boundary

GitHub-backed content must separate cached reads from fresh mutation paths.
Public page reads may use cached GitHub fetches, but save-time conflict checks and writes must always read fresh state.

**Avoid:**

```ts
const current = await loadGitHubTextFile(pathname)

if (createContentVersion(current?.content ?? '') !== expectedVersion) {
  throw new StorageVersionConflictError('conflict')
}
```

**Prefer:**

```ts
const current = await loadGitHubTextFileFresh(pathname)

if (createContentVersion((current?.content ?? '').trimEnd()) !== expectedVersion) {
  throw new StorageVersionConflictError('conflict')
}

await saveGitHubTextFile(pathname, content, { expectedVersion })
```
