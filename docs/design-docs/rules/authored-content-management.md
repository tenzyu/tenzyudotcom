---
title: "Authored Content Management"
impact: HIGH
impactDescription: プログラム（Code）と人間が管理するデータ（Data）を物理的に分離し、デプロイなしでのコンテンツ更新を可能にする。
tags: content, storage, architecture
chapter: Foundations
---

# Authored Content Management

プログラムのソースコード（`src/`）の中に、人間が随時更新するコンテンツ定数（`*_SOURCE_ENTRIES` 等）を直接保持しない。これらは物理的に分離し、適切なストレージ層で管理する。

- **Storage Separation**: コンテンツは `storage/` 配下（`editorial/*.json`, `blog/*.mdx` 等）に集約する。
- **Contract First**: データの構造は `src/app/.../_features/*.contract.ts` 等で Zod を用いて厳格に定義し（JSON）、または MDX フロントマターのバリデーターを通じて、読み込み時に必ず整合性を確認する。
- **Environment Transparency**: 開発時はローカルのファイルを、本番時はクラウドストレージ（Vercel Blob）を透過的に利用する。
- **Synchronicity**: クラウドとローカルのデータは、専用の同期スクリプト（`scripts/sync-storage.ts`）を介して手動で同期可能にする。

**Incorrect:**

```typescript
// src/ 配下のドメインファイルに、人間が編集するデータをハードコードする
export const MY_LINKS = [
  { name: 'X', url: 'https://x.com/...' },
  // 編集のたびに Git コミットと再デプロイが必要になる
]
```

**Correct:**

```typescript
// src/ 配下には「型」と「バリデーション」のみを置く
export type MyLink = { name: string; url: string }

// データはストレージから動的に読み込む
const { collection } = await editorialRepository.loadState('links')
```
