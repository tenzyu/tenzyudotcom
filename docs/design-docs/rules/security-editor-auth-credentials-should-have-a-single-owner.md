---
title: Editor Auth Credentials Should Have A Single Owner
impact: MEDIUM
impactDescription: admin password や session secret の参照が複数ファイルへ広がると、認証ロジックの境界が曖昧になり、変更時の見落としが増える。
tags: auth, env, ownership
chapter: Security & Safety
---

# Editor Auth Credentials Should Have A Single Owner

`EDITOR_ADMIN_PASSWORD` や `EDITOR_SESSION_SECRET` は、どこからでも `env.contract.ts` を読んでよい値ではありません。  
admin 認証の owner を `src/features/admin/session.ts` に寄せ、`actions.ts` などの mount point は `verifyEditorAdminPassword()` や `requireEditorAdminSession()` のような helper だけを呼ぶ形にすると、責務と変更点が安定します。

**Incorrect:**

```tsx
import { env, getRequiredEditorAdminCredentials } from '@/config/env.contract'

export async function loginEditorAdminAction(formData: FormData) {
  if (!env.editorAdminPassword) return
  const { password } = getRequiredEditorAdminCredentials()
  return isValidEditorAdminPassword(input, password)
}
```

**Correct:**

```tsx
import { verifyEditorAdminPassword } from '@/features/admin/session'

export async function loginEditorAdminAction(formData: FormData) {
  if (!verifyEditorAdminPassword(input)) return
}
```
