---
title: Actions Mount Through Assemble
impact: HIGH
impactDescription: "`actions.ts` を薄い mount point に保ち、infra 依存の漏出を防ぐ。"
tags: dependency-inversion, server-actions, editor
chapter: Implementation
---

## Actions Mount Through Assemble

`src/app/.../_features/actions.ts` は Server Action の mount point であり、直接 `*.infra.ts` を呼ばない。  
入力検証は近傍の `*.assemble.ts`、認可は `session.ts`、保存や取得は use case に委譲する。

**Avoid:**

```tsx
import { makeEditorRepository } from "@/lib/editor/editor.assemble"

export async function saveBlogPostAction(formData: FormData) {
  await makeEditorRepository().saveBlogPost(slug, frontmatter, body, version)
}
```

**Prefer:**

```tsx
import { parseEditorBlogSaveInput } from "./editor-input.assemble"
import { makeSaveBlogPostUseCase } from "./editor.assemble"

export async function saveBlogPostAction(formData: FormData) {
  const parsed = parseEditorBlogSaveInput(...)
  const saveUseCase = makeSaveBlogPostUseCase()
  await saveUseCase.execute(slug, frontmatter, body, version)
}
```
