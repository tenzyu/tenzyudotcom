---
name: vercel-blob-integration
description: 進行中のタスク：EDITORIAL_STORAGE_DRIVER=blob を本番利用するための設定作業。
summary: Vercelのプロジェクト設定に環境変数を投入し、blobストレージを有効化する。
read_when:
  - Vercel Blob との統合を本番環境に行う時
skip_when:
  - 別のストレージプロバイダーに関する作業時
user-invocable: false
---

# Vercel Blob Integration (Follow-up)

`EDITORIAL_STORAGE_DRIVER=blob` を実際に使うために、Vercel projectの環境変数（env）に以下の必要なキーをシークレットとしてシードするタスク。

- `EDITORIAL_ADMIN_PASSWORD`
- `EDITORIAL_SESSION_SECRET`
- `EDITORIAL_STORAGE_DRIVER=blob`
- `EDITORIAL_BLOB_PREFIX`
- `BLOB_READ_WRITE_TOKEN`

※ storage周りで blob token や Vercel env が未設定でブロックされる場合は、ローカルの `local` driver のまま作業を継続すること。
