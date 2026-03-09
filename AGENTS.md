# AGENTS: Harness Engineering Map

このドキュメントは、LLMエージェントが「段階的開示（Progressive Disclosure）」の原則に従ってリポジトリの手がかりを辿るための**100行未満の目次（マップ）**です。
各領域の専門的な仕様については、必要に応じて対応するファイルを参照してください。

## 1. 原則とアーキテクチャ (Design Docs)
- [ARCHITECTURE](./docs/ARCHITECTURE.md) : 最上位のドメイン領域、主要ディレクトリの意味、第一候補の置き場所
- [GUARDRAILS](./docs/GUARDRAILS.md) : LLM が実装前に確認する運用 guard の要約
- [DESIGN](./docs/DESIGN.md) : UI/UX、タイポグラフィ、アクセシビリティの方針
- [FRONTEND](./docs/FRONTEND.md) : フロントエンド固有の役割分割、ファイル配置、ローカルファーストの原則
- [PRODUCT SENSE](./docs/PRODUCT_SENSE.md) : サイトの長期価値（Living Curation）とプロダクト目線
- [QUALITY SCORE](./docs/QUALITY_SCORE.md) : クリーンコード、自動強制、負債の管理方針
- [RELIABILITY](./docs/RELIABILITY.md) : 障害耐性、メタデータ生成の安全性
- [SECURITY](./docs/SECURITY.md) : 境界・APIの保護、環境変数アクセスの方針
- [core-beliefs](./docs/design-docs/core-beliefs.md) : 判断の優先順位と深部の基本思想
- [guardrails](./docs/design-docs/guardrails.md) : Guardrails の正本。詳細な禁止パターンと slow down 条件
- [structure-rules](./docs/design-docs/structure-rules.md) : `docs/*` と `src/*` の詳細なファイル構造ルール
- [tools-boundary](./docs/design-docs/tools-boundary.md) : 外部ツール連携のルール
- [memory-management](./docs/design-docs/memory-management.md) : ドキュメントに何を残すべきか

## 2. プロダクト仕様 (Product Specs)
- 各ルートごとの固有の方針、構造の要件。作業時は以下から関連する領域を見にいくこと。
  - `/docs/product-specs/*.md`

## 3. 実行計画とハーネス運用 (Execution Plans & Workflows)
- `/docs/exec-plans/active/*.md` : この repo における `PLANS.md` / ExecPlan。backlog を含む進行中 task の作業 artifact。常に更新して次セッションへ引き継ぐ
- `/docs/exec-plans/completed/*.md` : 完了済み task の純粋な作業ログ
- `/docs/exec-plans/tech-debt-tracker.md` : まだ rule に昇格していない gap の保留場所
- [plan-authoring-workflow](./docs/workflows/plan-authoring-workflow.md) : active plan を書き始める時の作成補助
- [exec-plan-contract](./docs/workflows/exec-plan-contract.md) : `execution-ready` な active plan に必要な最小契約
- [agent-orchestration-workflow](./docs/workflows/agent-orchestration-workflow.md) : orchestrator が plan を委譲、review、archive する標準フロー

## 4. External References
- `/docs/references/*.md` : 外部ツールや外部実行環境とこの project を繋ぐ手順だけを置く
- [github-pr-workflow](./docs/references/github-pr-workflow.md) : GitHub CLI と develop 運用を繋ぐ PR フロー
- [error-analysis](./docs/references/error-analysis.md) : Vercel logs や runtime error 調査を project の再発防止へ繋ぐ手順
- [ui-verification](./docs/references/ui-verification.md) : browser automation を UI 検証フローへ繋ぐ手順

## 5. Routing
- 新しい依頼を受けた直後:
  - まずこの `AGENTS.md` を起点に該当領域を選ぶ
- plan の Markdown を新しく起こす時:
  - `./docs/workflows/plan-authoring-workflow.md`
- active plan を `execution-ready` に整える時:
  - `./docs/workflows/exec-plan-contract.md`
- サブエージェントへ委譲したい時:
  - `./docs/workflows/agent-orchestration-workflow.md`
  - `./docs/exec-plans/active/*.md`
- file placement に迷った時:
  - `./docs/ARCHITECTURE.md`
  - `./docs/GUARDRAILS.md`
  - `./docs/design-docs/structure-rules.md`
- route / product の文脈に迷った時:
  - `./docs/product-specs/*.md`
- 外部ツール連携の確認が必要な時:
  - `./docs/references/*.md`

## 6. Skills
- 詳細なIntlayerコマンド、Shadcn等の使い方は特定のスキルフォルダを参照:
  - `.agents/skills/` 内の各SKILL.md

## 7. Generated Reports
- 定期的なリサーチや監査の成果物:
  - [harness-engineering-report](./docs/generated/harness-engineering-report.md) : 現行ハーネスの解析と改善提案 (2026-03-09)
