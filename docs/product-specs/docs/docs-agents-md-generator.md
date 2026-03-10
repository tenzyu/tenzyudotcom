---
title: agents-md-generator-spec
description: docs/design-docs/rules/** から AGENTS.md を自動生成するコンパイラの仕様。
---

# AGENTS.md Generator Spec

## Goal
`docs/design-docs/rules/*.md` に散らばっている個別のルールを収集・結合し、LLM が一括で読み込みやすく、かつ構造化された `docs/design-docs/AGENTS.md` を自動生成する。

## Inputs
- **Source**: `docs/design-docs/rules/*.md`
- **Metadata**: 各ルールの YAML Frontmatter
  - `title`: ルールのタイトル
  - `impact`: 影響度 (LOW, MEDIUM, HIGH, CRITICAL)
  - `impactDescription`: 影響の簡潔な説明
  - `tags`: 分類用のタグ（カンマ区切り）
  - `chapter`: (追加予定) AGENTS.md 内での章立て

## Output
- **Target**: `docs/design-docs/AGENTS.md`
- **Format**: 以下の構成を持つ単一の Markdown ファイル
  1. **Header**: タイトル、バージョン、日付、LLM 向けノート
  2. **Abstract**: サイトの設計思想の要約
  3. **Table of Contents**: 章ごとの見出しとルールのリスト（Impact 付き）
  4. **Rule Content**: 各章ごとの詳細なルール説明（Incorrect/Correct 例を含む）
  5. **References**: 各ルールからの外部リンクや関連ドキュメントの集約

## Processing Logic
1. `rules/` 内の全 `.md` ファイルを読み込む。
2. Frontmatter からメタデータを抽出する。
3. `chapter` フィールド（または `tags` の最初の要素）に基づいてルールをグループ化する。
4. 目次を生成し、アンカーリンクを作成する。
5. 各ルールの本文（`#` 見出しを除いた部分）を整形して結合する。
6. 重複する `Reference` を集約する。

## Command
- `bun run build:docs-map`: コンパイラを実行して AGENTS.md を更新する。
