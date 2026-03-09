---
name: make-it-optimised-as-harness-engineering
description: 作業済みタスク：Harness Engineeringに基づくドキュメントリファクタリングのギャップ報告書。
summary: "段階的開示モデルへの移行、メタデータ最適化、Doc-Gardening基盤の整備等についての事後報告。"
read_when:
  - Harness Engineering移行フェーズでの具体的な変更点やディレクトリの変遷を確認する時
skip_when:
  - アクティブなコード開発時
user-invocable: false
---

# Harness Engineering 実装前後のギャップ報告書

今回のリファクタリング作業により、プロジェクト全体のドキュメント構造が、AIエージェントの「段階的開示（Progressive Disclosure）」に最適化されたHarness Engineeringモデルへと完全に再構築されました。

以下は、作業開始前（Before）と現在（After）の成果物のギャップの要約です。

## 1. ディレクトリ構造とファイルの責務

### Before（作業前）
- `docs/harness/` という単一のディレクトリに、ケーススタディやルールが混在していた。
- 一部の仕様書（`product-specs/`など）は、`body_refs`という概念でフロントマターと実体（[body.md](file:///home/tenzyu/Documents/tenzyudotcom/docs/product-specs/blog-product-spec/body.md)）が別ファイルに分割されており、エージェントのコンテキスト検索時に余分なジャンプ（2回の読み込み）が発生していた。
- ルートレベルにエージェントが真っ先に読むべき「制約」を示す規律（ポリシー）ファイルが存在しなかった。

### After（作業後）
- `docs/harness/` は完全に解体され、以下の4つのセマンティックなディレクトリに整理されました：
  - `docs/design-docs/` (設計の基本原則、境界のルール)
  - `docs/exec-plans/` (アクティブな計画、完了したケース記録)
  - `docs/product-specs/` (特定のルートやドメインのプロダクト固有仕様)
  - **[NEW]** `docs/references/` (外部ライブラリなどの外部リファレンス用)
- `product-specs/` で分割されていた `body.md` の内容はすべて各インデックスファイル内に**統合**され、無駄なファイルアクセスのギャップが解消されました。
- **[NEW]** エージェントの判断の軸（ゴールデンプリンシプル）となる6つの高度なポリシーファイルがルートレベルに追加されました：
  - `docs/DESIGN.md`
  - `docs/FRONTEND.md`
  - `docs/PRODUCT_SENSE.md`
  - `docs/QUALITY_SCORE.md`
  - `docs/RELIABILITY.md`
  - `docs/SECURITY.md`

## 2. メタデータ（Frontmatter）の最適化

### Before（作業前）
- `docs/` 配下のファイルの YAML Frontmatter（記述情報）が英語で書かれていた。
- Frontmatterに含まれるキー定義が曖昧で、ドキュメントのインデックスとしての役割を果たしきれていなかった。

### After（作業後）
- 全ての実装ファイル（計21ファイル）の YAML Frontmatter が**完全に日本語へ翻訳**されました。
- `name`, `description`, `summary`, `read_when`, `skip_when`, `user-invocable` という固定の LLM 最適化スキーマが導入され、エージェントが「いつこのファイルを読み飛ばすべきか（`skip_when`）」を正確に判断できるようになりました。

## 3. ドキュメントの自己修復（Doc-Gardening）機能

### Before（作業前）
- 「コードの変更とドキュメントの陳腐化」に対応する明確な自動化の方針が存在しなかった。

### After（作業後）
- 新しく `docs/exec-plans/active/doc-linter-spec.md` を設立。以下の要件をリンター/CI側に強制する仕様を追記しました。
  1. 上記の日本語の Frontmatter スキーマ（`read_when`, `skip_when` 等）が全ファイルに存在すること。
  2. リンク切れの防止。
  3. CIでのドキュメント乖離の検知と定期的な PR の自動作成。

## 結論

今回の作業で、コードとしてのドキュメントのインターフェースが**LLMフレンドリーかつ安全なものへと劇的に改善**されました。今後のあらゆる機能追加において、エージェントは必ず `AGENTS.md` を起点とし、新設された`docs/SECURITY.md`や`docs/FRONTEND.md`といった規律ファイルを通して意図しないコードの生成を防ぐ「ガードレール」の中で安全に作業できるようになります。
