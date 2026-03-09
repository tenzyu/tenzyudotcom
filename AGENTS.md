# AGENTS: Harness Engineering Map

このドキュメントは、LLMエージェントが「段階的開示（Progressive Disclosure）」の原則に従ってリポジトリの手がかりを辿るための**100行未満の目次（マップ）**です。
各領域の専門的な仕様については、必要に応じて対応するファイルを参照してください。

## 1. 原則とアーキテクチャ (Design Docs)
- [ARCHITECTURE](./docs/ARCHITECTURE.md) : 最上位のドメイン領域とパッケージ階層図
- [DESIGN](./docs/DESIGN.md) : UI/UX、タイポグラフィ、アクセシビリティの方針
- [FRONTEND](./docs/FRONTEND.md) : フロントエンド固有の役割分割、ファイル配置、ローカルファーストの原則
- [PRODUCT SENSE](./docs/PRODUCT_SENSE.md) : サイトの長期価値（Living Curation）とプロダクト目線
- [QUALITY SCORE](./docs/QUALITY_SCORE.md) : クリーンコード、自動強制、負債の管理方針
- [RELIABILITY](./docs/RELIABILITY.md) : 障害耐性、メタデータ生成の安全性
- [SECURITY](./docs/SECURITY.md) : 境界・APIの保護、環境変数アクセスの方針
- [core-beliefs](./docs/design-docs/core-beliefs.md) : 判断の優先順位と深部の基本思想
- [guardrails](./docs/design-docs/guardrails.md) : やってはならない事、禁止パターン
- [structure-rules](./docs/design-docs/structure-rules.md) : 詳細なファイル構造のルール
- [tools-boundary](./docs/design-docs/tools-boundary.md) : 外部ツール連携のルール
- [memory-management](./docs/design-docs/memory-management.md) : ドキュメントに何を残すべきか

## 2. プロダクト仕様 (Product Specs)
- 各ルートごとの固有の方針、構造の要件。作業時は以下から関連する領域を見にいくこと。
  - `/docs/product-specs/*.md`

## 3. 実行計画と過去のケーススタディ (Execution Plans)
- `/docs/exec-plans/active/*.md` : 進行中の個別の実行計画、TODO、短期的なタスク（1タスク＝1ファイル）
- `/docs/exec-plans/completed/*.md` : 過去の意思決定ログ（バグ解決の理由、メタデータ仕様策定経緯など）
- `/docs/exec-plans/tech-debt-tracker.md` : 現在の未定義ギャップ、将来実装予定の技術的負債

## 4. Prompts & Workflows (Harness Core)
エージェントの動作規定。`docs/exec-plans/**` の作業時は、必要に応じてこれらのハーネスも自動更新すること。
- [autonomous-agent](./prompts/autonomous-agent.md) : **[最優先]** 自立駆動してタスクを完遂するためのメインプロンプト
- `/prompts/*.md` : その他、特定の検証やテスト用プロンプト

## 5. Skills & References
- 詳細なIntlayerコマンド、Shadcn等の使い方は特定のスキルフォルダを参照:
  - `.agents/skills/` 内の各SKILL.md
- 詳細なエラー分析やGitHub CLI等の使い方は特定のリファレンスフォルダを参照:
  - `/docs/references/*.md`
