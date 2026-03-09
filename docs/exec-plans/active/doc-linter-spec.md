---
name: harness-doc-linter-spec
description: 進行中のタスク：ドキュメントリンターの要件定義と仕様策定。
summary: "リンク切れ検知、メタデータ検証、およびAI主導のドキュメント整備を自動化するLinter機能の仕様。"
read_when:
  - カスタムリンター（lint-docs.ts）の拡張・修正を行う時
  - CIフローの一部としてドキュメントの鮮度をチェックする機能を追加する時
skip_when:
  - 通常のUIコンポーネントの修正時
user-invocable: false
---

# ドキュメント整備（Doc-Gardening）リンター仕様

このドキュメントは、AGENTS.md を起点とした「段階的開示（Progressive Disclosure）」の構造が維持されているか、およびMarkdownファイルの鮮度・構文が適正かを自動検証するリンター（およびCIジョブ）の仕様を定義します。

## 1. リンク到達アビリティ・チェッカー (Link Reachability Checker)

**目的**: `AGENTS.md` をルートノードとし、そこからリンクされているすべての `docs/**/*.md` ファイルに到達可能か（孤立したドキュメントがないか）、およびリンク切れが存在しないかを検証します。

### 検証要件
- **Entry Point**: ルートディレクトリの `AGENTS.md`。
- **Traverse**: `AGENTS.md` 内の相対リンク（`./docs/...`）をパースし、再帰的にリンク先ドキュメントを検証します。
- **Orphan Detection**: `docs/` ディレクトリ配下に存在するすべての `.md` ファイルをリストアップし、先のエントリポイントからのトラバースツリーに含まれないファイル（孤立ファイル = Orphan）をエラーとして報告します。
- **Dead Link Detection**: リンク先のファイルパスが存在しない場合、エラーとして報告します。

## 2. 鮮度・陳腐化チェッカー (Freshness / Obsolescence Checker)

**目的**: コードベースの実態とドキュメントの記述が著しく乖離していないかを判定します。

### 検証要件
- **Last Modified Check**: `.ts` や `.tsx` などの主要なソースファイル群の最終更新日と、関連する `docs/` 側の設計ドキュメントの最終更新日を比較します。ソース全体が大きく変化しているにも関わらず、特定の設計ドキュメントが長期間（例: 半年以上）更新されていない場合、警告（Warning）を出力します。
- **AI-Driven Doc-Gardening**: 定期（例: 週1回）で実行されるCIジョブにより、LLMエージェントが `docs/design-docs/` などの主要なドキュメントと最新のコードベースを比較スキャンします。乖離を発見した場合は、自動でドキュメント修正用のプルリクエスト（PR）を作成します。

## 3. Markdown 構文・フォーマットチェッカー (Markdown Syntax & Format Checker)

**目的**: Frontmatterを含め、リンクやリスト構成がLLMパーサーにとって正しく読める、標準的でバグのないMarkdownであることを保証します。

### 検証要件
- **Linting Tool**: `markdownlint` や `remark-lint` などの標準ツールをCIに組み込みます。
- **Rules**:
  - `MD001` (Header levels should only increment by one level at a time)
  - `MD004` (Unordered list style: consistent)
  - `MD031` (Fenced code blocks should be surrounded by blank lines)
- **Frontmatter Validation**: すべてのドキュメントが適切なYAML Frontmatterを持ち、以下のLLM最適化スキーマに準拠しているかバリデーションします。

## 4. Frontmatter 構造チェッカー (Frontmatter Schema Checker)

**目的**: `docs/` 配下のすべてのMarkdownが、LLMの文脈理解に最適化された標準プロパティ（日本語による記述）を持っているか検証します。

### 検証要件
すべてのMarkdownファイルは以下のプロパティを持つYAML Frontmatterを含まなければなりません。
- `name` (必須): ドキュメントの一意な識別子（例: `harness-guard`）。これのみ英語/ケバブケースを許容。
- `description` (必須): ドキュメントの目的を一言で表す説明（日本語）。
- `summary` (任意推奨): ドキュメントが解決する課題や内容の要約（日本語）。
- `read_when` (必須): LLMエージェントが「どのようなタスクの時にこのドキュメントを読むべきか」の具体的なトリガー条件のリスト（日本語）。
- `skip_when` (任意): 逆にファイルを読まなくてよい・無関係な状況のリスト（日本語）。
- `user-invocable` (任意): ユーザーが直接呼び出すスキルかどうかの真偽値（boolean）。
