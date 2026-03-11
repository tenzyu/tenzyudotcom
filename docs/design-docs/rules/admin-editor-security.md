---
title: "Security: Private Admin Editor"
impact: HIGH
impactDescription: 自信のみが利用する管理画面の安全性を、セッション署名とパスバリデーションで担保する。
tags: security, admin, session
chapter: Security & Safety
---

# Security: Private Admin Editor

自分専用の編集画面（`/editor`）において、不正アクセス、セッション改ざん、およびファイルシステムへの意図しない操作を防ぐ。

## Session Management

セッションは、環境変数 `EDITOR_SESSION_SECRET` を用いた HMAC-SHA256 署名付き Cookie で管理する。

- **HttpOnly & SameSite=Lax**: クライアントサイドスクリプトからのアクセスを防ぎ、CSRF リスクを低減する。
- **TTL**: 適切な有効期限（例: 14日間）を設定し、期限切れのセッションを無効化する。
- **Constant-time Comparison**: `timingSafeEqual` を使用して、タイミング攻撃による署名検証の回避を防ぐ。

## Input Validation & Sanitization

外部からの入力（特にパスに関連するもの）は常に危険であると見なし、サニタイズを行う。

- **Zod Schema**: すべての Server Actions で入力を Zod で検証し、許可された `collectionId` のみを処理する。
- **Path Sanitization**: ファイル名やパスを生成する際、`path.basename` 等を使用してディレクトリトラバーサルを防ぐ。

## Overwrite Protection (Optimistic Concurrency Control)

複数端末からの同時編集による「後勝ち」上書きを防ぐため、バージョンチェックを行う。

- **Hash-based Versioning**: ロード時のコンテンツのハッシュ（SHA-256）を `expectedVersion` として保持し、保存時に現在のストレージ上のハッシュと比較する。
- **MDX support**: JSON コレクションだけでなく、MDX（Blog）に対しても全文ハッシュによる競合検出を適用する。

**Incorrect:**

```tsx
// 認証なし、または入力をそのままファイル名に使用
export async function saveAction(id: string, content: string) {
  await writeFile(`./storage/${id}.json`, content);
}
```

**Correct:**

```tsx
// 認証を確認し、パスをサニタイズし、バージョンをチェックする
export async function saveAction(unsafeId: string, content: string, expectedVersion?: string) {
  await requireAdminSession();
  const id = CollectionIdSchema.parse(unsafeId);
  const safePath = join(STORAGE_DIR, `${basename(id)}.json`);
  
  const current = await readFile(safePath);
  if (expectedVersion && createHash(current) !== expectedVersion) {
    throw new ConflictError();
  }
  
  await writeFile(safePath, content);
}
```
