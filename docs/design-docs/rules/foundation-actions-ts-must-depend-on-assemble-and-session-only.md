---
title: actions.ts Must Depend On Assemble And Session Only
impact: HIGH
impactDescription: mount point である `actions.ts` が `*.infra.ts` に直接依存すると、dependency inversion の境界が崩れ、UI/application から infrastructure 実装が漏れ出す。
tags: dependency-inversion, server-actions, editor
chapter: Foundations
---

# actions.ts Must Depend On Assemble And Session Only

`src/app/.../_features/actions.ts` は Server Action の mount point であり、薄く保つ。  
入力検証は近傍の `*.assemble.ts`、認可は `session.ts`、保存や取得は use case に委譲し、`actions.ts` から `*.infra.ts` や repository factory を直接叩かない。

**Incorrect:**

```tsx
import { makeEditorRepository } from '@/lib/editor/editor.assemble'

export async function saveBlogPostAction(formData: FormData) {
  await makeEditorRepository().saveBlogPost(slug, frontmatter, body, version)
}
```

**Correct:**

```tsx
import { parseEditorBlogSaveInput } from './editor-input.assemble'
import { makeSaveBlogPostUseCase } from './editor.assemble'

export async function saveBlogPostAction(formData: FormData) {
  const parsed = parseEditorBlogSaveInput(...)
  const saveUseCase = makeSaveBlogPostUseCase()
  await saveUseCase.execute(slug, frontmatter, body, version)
}
```
