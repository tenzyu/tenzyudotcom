---
schema: harness/v1
kind: knowledge
knowledge_type: rule
id: knowledge.rule.implementation.editor-errors-and-blog-saving-should-cross-boundaries-via-port
title: Editor Errors And Blog Saving Should Cross Boundaries Via Port
status: active
tags:
  - dependency-inversion
  - blog
  - editor
impact: MEDIUM
x:
  legacy:
    impactDescription: application 層が infra 定義の例外型や特別保存処理に直接依存すると、JSON collection と blog の差分処理が infrastructure に引きずられる。
    chapter: Implementation
---

# Editor Errors And Blog Saving Should Cross Boundaries Via Port

`blog` は editor collection の中でも特別で、JSON の一括保存ではなく MDX/frontmatter の保存経路を通ります。  
それでも application 層は `infra` 直参照ではなく、`port/domain` に公開された repository interface とエラー型を通して扱うのが安全です。`EditorVersionConflictError` のような UI/application が捕捉する型も `port/domain` 側に置くと境界が崩れません。

**Avoid:**

```tsx
import {
  makeEditorRepository,
  EditorVersionConflictError,
} from '@/lib/editor/editor.assemble'

await makeEditorRepository().saveBlogPost(slug, frontmatter, body, version)
```

**Prefer:**

```tsx
import { EditorVersionConflictError } from '@/lib/editor/editor.port'
import { makeSaveBlogPostUseCase } from './editor.assemble'

const saveUseCase = makeSaveBlogPostUseCase()
await saveUseCase.execute(slug, frontmatter, body, version)
```
