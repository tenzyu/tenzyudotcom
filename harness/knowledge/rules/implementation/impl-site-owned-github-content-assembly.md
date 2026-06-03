---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.implementation.site-owned-github-content-assembly
title: Site Owned GitHub Content Assembly
status: active
tags:
  - architecture
  - storage
  - github
  - packages
  - subject:architecture
  - subject:storage
  - domain:github
  - kind:rule
  - criticality:medium
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: keeps package boundaries clean by separating generic GitHub clients from site-specific caching and schemas
    chapter: Implementation
---

## Site Owned GitHub Content Assembly

Do not extract GitHub content code into a shared package if it still knows site-specific cache tags, manifests, or route semantics.
Only generic GitHub Contents API mechanics belong in a shared package. Site-specific assembly stays in `site`.

**Avoid:**

```ts
export async function upsertGitHubBlogIndexEntry(entry: GitHubBlogIndexEntry) {
  revalidateTag('content:blog:index', 'max')
  // package knows site manifest and cache tags
}
```

**Prefer:**

```ts
// shared package
export async function putGitHubContent(pathname: string, content: string) {}

// site
await putGitHubContent('blog/index.json', serialized)
revalidateTag(BLOG_INDEX_CONTENT_TAG, 'max')
```
