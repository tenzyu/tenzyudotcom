---
title: actions.ts Must Depend On Assemble And Session Only
impact: HIGH
impactDescription: mount point である `actions.ts` が `*.contract.ts` に直接依存すると、dependency inversion の境界が崩れ、UI/application から infrastructure 実装が漏れ出す。
tags: dependency-inversion, server-actions, editor
chapter: Foundations
---

# actions.ts Must Depend On Assemble And Session Only

`src/app/.../_features/actions.ts` は Server Action の mount point であり、入力検証、認可、画面遷移だけを担当するのがよいです。  
取得・保存の実処理は `*.assemble.ts` の use case に委譲し、認証情報やセッション処理は `session.ts` に寄せます。`actions.ts` から `*.contract.ts` を直接 import しないのが実運用上の前提です。

**Incorrect:**

```tsx
import { editorRepository } from '@/lib/editor/editor.contract'

export async function saveBlogPostAction(formData: FormData) {
  await editorRepository.saveBlogPost(slug, frontmatter, body, version)
}
```

**Correct:**

```tsx
import { makeSaveBlogPostUseCase } from './editor.assemble'

export async function saveBlogPostAction(formData: FormData) {
  const saveUseCase = makeSaveBlogPostUseCase()
  await saveUseCase.execute(slug, frontmatter, body, version)
}
```
