---
title: Editor Session Boundary
impact: HIGH
impactDescription: editor 認証情報の owner を 1 か所に寄せ、session 検証を安定した境界として保つ。
tags: security, admin, auth, env
chapter: Security & Safety
---

## Editor Session Boundary

`EDITOR_ADMIN_PASSWORD` と `EDITOR_SESSION_SECRET` は editor session owner だけが扱う。  
mount point は session helper を呼ぶだけに留める。

**Avoid:**

```tsx
import { env, getRequiredEditorAdminCredentials } from "@/config/env.infra"

export async function loginEditorAdminAction(formData: FormData) {
  const { password } = getRequiredEditorAdminCredentials()
  return isValidEditorAdminPassword(input, password)
}
```

**Prefer:**

```tsx
import { verifyEditorAdminPassword, requireEditorAdminSession } from "./editor-session"

export async function loginEditorAdminAction(formData: FormData) {
  if (!verifyEditorAdminPassword(input)) return
}
```

