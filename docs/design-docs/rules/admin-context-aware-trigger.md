---
title: "Admin Context Aware Trigger"
impact: MEDIUM
impactDescription: 閲覧中のページから直接編集アクションへ誘導し、コンテンツ管理の摩擦を最小化する。
tags: admin, ux, context
chapter: Intelligence
---

# Admin Context Aware Trigger

管理機能は、独立した「管理画面」に閉じるのではなく、ユーザーが「今見ているコンテンツ」のコンテキストから直接呼び出せるように設計する。

- **In-Context Access**: 現在のパス（`x-pathname`）を認識し、適切な編集ページへのショートカットを動的に露出させる。
- **Conditional Visibility**: 管理用トリガーは、権限（セッション）を持つユーザーにのみ表示する。一般ユーザーのバンドルや DOM に不要な情報を露出させない。
- **Action Mapping**: パスと管理対象（Editorial Collection ID）の対応付けは、物理的なディレクトリ構造ではなく、専用のユーティリティ（`matchCollectionIdByPath` 等）で明示的に定義する。
- **Entity Identification**: 詳細ページ（例: 個別ブログ記事）では、パスから Slug を抽出してエディタに引き継ぎ、特定のエンティティを直接開く体験を提供する。

**Incorrect:**

```text
// コンテンツを編集するために、管理ダッシュボードを開き、サイドバーから項目を探し、
// 一覧から対象の ID を検索して、ようやく編集ボタンをクリックする。
```

**Correct:**

```text
// ログイン中に公開ページ（例: /ja/notes）を閲覧しているとき、
// 画面端に表示される小さな「編集ボタン」を 1 クリックして、即座に編集画面に入る。
```
