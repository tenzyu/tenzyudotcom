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

## 3. 実行計画とハーネス運用 (Execution Plans & Workflows)
- `/docs/exec-plans/active/*.md` : 進行中 task の source of truth。委譲する task はここに揃える
- `/docs/exec-plans/completed/*.md` : 完了済みケースの意思決定ログ
- `/docs/exec-plans/tech-debt-tracker.md` : まだ rule に昇格していない gap の保留場所
- [agent-orchestration-workflow](./docs/workflows/agent-orchestration-workflow.md) : 新規依頼から active plan 作成、サブエージェント委譲までの標準フロー
- [exec-plan-contract](./docs/workflows/exec-plan-contract.md) : `execution-ready` な active plan の最小契約

## 4. External References
- `/docs/references/*.md` : 外部ツールや外部実行環境とこの project を繋ぐ手順だけを置く
- [github-pr-workflow](./docs/references/github-pr-workflow.md) : GitHub CLI と develop 運用を繋ぐ PR フロー
- [error-analysis](./docs/references/error-analysis.md) : Vercel logs や runtime error 調査を project の再発防止へ繋ぐ手順
- [ui-verification](./docs/references/ui-verification.md) : browser automation を UI 検証フローへ繋ぐ手順

## 5. Routing
- 新しい依頼を受けた直後:
  - まずこの `AGENTS.md` を起点に該当領域を選ぶ
- サブエージェントへ委譲したい時:
  - `./docs/workflows/agent-orchestration-workflow.md`
  - `./docs/workflows/exec-plan-contract.md`
  - `./docs/exec-plans/active/*.md`
- file placement に迷った時:
  - `./docs/design-docs/structure-rules.md`
- route / product の文脈に迷った時:
  - `./docs/product-specs/*.md`
- 外部ツール連携の確認が必要な時:
  - `./docs/references/*.md`

## 6. Skills
- 詳細なIntlayerコマンド、Shadcn等の使い方は特定のスキルフォルダを参照:
  - `.agents/skills/` 内の各SKILL.md
