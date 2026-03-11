---
title: Remove No Need Admin Trigger
description: 各公開ページから不要になったフローティングの EditorAdminTrigger を削除するタスク
---

# Remove No Need Admin Trigger

各機能の公開ページ内に、インラインの編集UI（Admin View / `[Collection]EditorDeferred`）が埋め込まれるようになったため、画面右下に表示されていた別ページ遷移用のフローティングアクションボタン（`EditorAdminTrigger`）が不要となりました。

本計画では、不要になった `EditorAdminTrigger` コンポーネントの呼び出しを全てのページから削除し、不要になったコンポーネントファイルそのものを削除します。

## 対象ファイルと作業内容

### 1. `EditorAdminTrigger` の呼び出し削除
以下の 6 つのファイルから `<EditorAdminTrigger>` コンポーネントおよび、それを単独で囲んでいる `<AdminGate>`、ならびに関連する `import` 文を削除します。

- `src/features/links/link-list.tsx`
- `src/app/[locale]/(main)/recommendations/_features/recommendations-page-content.tsx`
- `src/app/[locale]/(main)/blog/_features/blog-page-content.tsx`
- `src/app/[locale]/(main)/puzzles/_features/puzzles-page-content.tsx`
- `src/app/[locale]/(main)/notes/_features/notes-page-content.tsx`
- `src/app/[locale]/(main)/pointers/_features/pointers-page-content.tsx`

※ 注意: ページ上部の Admin View (`xxxEditorDeferred`) を囲んでいる `<AdminGate>` は**削除してはいけません**。削除対象は、ページ末尾の `EditorAdminTrigger` を囲むもののみです。

### 2. コンポーネントファイルの削除
呼び出し元がゼロになるため、以下のコンポーネントファイル本体を削除します。

- `src/features/admin/admin-trigger.tsx`

### 3. 検証（Verification）
- `bun run lint` を実行し、未使用の `import` 等のエラーがないことを確認する。
- `bun run build` を実行し、型エラーや未定義モジュールの参照エラーが出ないことを確認する。
