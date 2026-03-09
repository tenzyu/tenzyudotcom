---
name: blog-product-spec
description: ブログセクションのための、リポジトリ固有のプロダクト仕様。
summary: /blog機能のためのレイアウト制約、執筆プロセス、および編集構造に関するルールを定義する。
read_when:
  - ブログのレイアウト、コンポーネント、またはカテゴリ構造を修正する時
  - ブログのレンダリング問題を修正する時
  - ブログ記事の機能（目次の追加、MDXの機能など）を拡張する時
skip_when:
  - 既存の独立したブログ記事の実際のコンテンツを編集している時
user-invocable: false
---

# Blog Product Spec

## 1. Feature Role & Scope

`/blog` は、技術記事、思考プロセスの記録、または定期的な更新を公開する主要なパブリッシング機能である。
長文のコンテンツ、コードスニペット、画像などの豊かな表現力（MDXなど）をサポートすることが求められる。

## 2. Editorial Structure & Authoring

- **Separation of Authoring and Rendering**: 記事のコンテンツ（Markdown/MDX）ソースとレンダリングコンポーネントは明確に分離される。
- **Categories**: カテゴリは一貫して適用され、ブログトップページやナビゲーションで明確に区別される。
- **Metadata**: タイトル、公開日、更新日、タグなどのメタデータは構造化され、システムから予測可能であること。

## 3. Layout & Presentation Rules

- **Readability Priority**: タイポグラフィ、行間、コントラストは読者の可読性を最優先に調整する。
- **Layout Bugs Mitigation**: 画像のレスポンシブ崩れや、長いコードブロックのオーバーフローといった一般的なレイアウトバグを未然に防ぐため、堅牢なコンテナスタイル（`prose` など）を使用・拡張する。
- **Navigation**: 全ての記事にカテゴリへの確実な戻り口と、関連する記事や次の記事への誘導など、回遊性を意識したUIを設ける。

## 4. Guardrails (LLMs)

- **Do NOT** break the blog's Markdown parsing or syntax highlighting logic without extensive verification.
- **Do NOT** mix blog-specific rendering logic (like highly customized MDX components) into the global `ui` directory. Create a specific `components` folder for the blog feature to contain these elements to avoid cross-contamination.
