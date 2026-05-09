---
title: Editor Write Safety
impact: HIGH
impactDescription: editor 保存処理で path 汚染と後勝ち上書きを防ぎ、安全な write 境界を保つ。
tags: security, admin, storage, versioning
chapter: Security & Safety
---

## Editor Write Safety

editor の write path は認証、input parse、path sanitization、version check を通してから実行する。

**Avoid:**

```tsx
export async function saveAction(id: string, content: string) {
  await writeFile(`./storage/${id}.json`, content)
}
```

**Prefer:**

```tsx
export async function saveAction(unsafeId: string, content: string, expectedVersion?: string) {
  await requireEditorAdminSession()
  const id = CollectionIdSchema.parse(unsafeId)
  const safePath = join(STORAGE_DIR, `${basename(id)}.json`)
  const current = await readFile(safePath)

  if (expectedVersion && createHash(current) !== expectedVersion) {
    throw new ConflictError()
  }

  await writeFile(safePath, content)
}
```
