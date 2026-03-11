---
title: Robust MDX Overwrite Protection
impact: HIGH
impactDescription: 複数セッションでの同時編集によるデータの消失（後勝ち）を確実に防ぐ。
tags: security, storage, mdx, versioning
chapter: Security & Safety
---

## Robust MDX Overwrite Protection

MDX や JSON ファイルを直接編集するシステムにおいて、ロード時の状態と保存時の状態を比較し、競合を検知する。

### Mechanism
ファイル全体の内容から SHA-256 ハッシュを生成し、これを「バージョン」として扱う。クライアントは編集開始時のハッシュを `expectedVersion` として保持し、サーバーサイドでの保存実行直前に、現在のストレージ上の最新ハッシュと一致するかを確認する。

**Incorrect:**

```tsx
// 無条件に上書き保存
export async function saveBlogPost(slug, body) {
  await writeFile(`./posts/${slug}.mdx`, body);
}
```

**Correct:**

```tsx
// バージョン（ハッシュ）をチェックしてから保存
export async function saveBlogPost(slug, body, expectedVersion) {
  const current = await readFile(`./posts/${slug}.mdx`);
  const currentHash = createHash(current);
  
  if (expectedVersion && currentHash !== expectedVersion) {
    throw new Error('Version Conflict: The file has been modified elsewhere.');
  }
  
  await writeFile(`./posts/${slug}.mdx`, body);
}
```

Reference: [Security: Private Admin Editor (rules)](/docs/design-docs/rules/admin-editor-security.md)
