---
title: Server Actions Require Auth Even For Helper Actions
impact: HIGH
impactDescription: 補助用途の Server Action を無認可のまま公開すると、管理 UI 専用の機能が外部から直接実行できてしまう。
tags: security, server-actions, admin
chapter: Security & Safety
---

# Server Actions Require Auth Even For Helper Actions

`use server` で公開された関数は、フォーム保存や本体更新だけでなく、URL メタデータ取得のような補助 action でも公開エンドポイントです。  
「editor 内からしか呼ばれない想定」は認可の代わりにならないため、admin 専用 action は最上部で必ず admin セッションを確認する必要があります。

**Incorrect:**

```tsx
'use server'

export async function fetchUrlMetadataAction(url: string) {
  const response = await fetch(url)
  return { title: await response.text() }
}
```

**Correct:**

```tsx
'use server'

import { hasEditorAdminSession } from '@/features/admin/session'

export async function fetchUrlMetadataAction(url: string) {
  if (!(await hasEditorAdminSession())) {
    return { error: 'Unauthorized' }
  }

  const response = await fetch(url)
  return { title: await response.text() }
}
```
