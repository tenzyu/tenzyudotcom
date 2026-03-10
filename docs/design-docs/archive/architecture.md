---
name: architecture
description: プロジェクトの主要なアーキテクチャ原則（所有権モデル、VSA、i18n等）の要約。
summary: 6層の所有権モデル、ハーネスエンジニアリング、境界設計、i18n、垂直スライスアーキテクチャの基本原則を定義する
read_when:
  - コンポーネントやフィーチャーの配置場所（ディレクトリ）を決定する時
  - サイト全体の所有権モデルや境界ルールについて確認する時
skip_when:
  - 特定のコンポーネント内での微小なスタイル変更や内部ロジックのみを修正する時
user-invocable: false
---

# Architecture

この設計思想の目的は変更を局所化し、実装に必要な文脈範囲を縮小することです。

## 垂直スライスアーキテクチャ

レイヤーによる水平分割ではなく、機能による垂直分割を基本とする。
`_features` サブディレクトリ: Next.js のルートディレクトリ内に UI、Logic、Data を一つのスライスとして閉じ込める。
Small Features Stay Flat: 小規模な機能はフォルダを深く掘らず、フラットな配置を維持して探索性を高める。

## 依存性逆転パターン

mount point に惑わされず、どこがロジックと状態と知識を所有するかを明確に分離する。

- `*.domain.ts` 純粋な型とルール
- `*.app.ts` ユースケース / アプリケーションフロー
- `*.ports.ts` 抽象 アプリケーションロジックに使われる
- `*.contract.ts` 具体的な外部実装

## ハーネス (Harness Engineering)

「ハーネス」は、AI エージェントがリポジトリを自律的に理解し、運用するための「ドキュメント駆動型インフラ」である。

### Core Policies (Golden Principles)
| Path | Responsibility |
| :--- | :--- |
| `AGENTS.md` | 全ドキュメントの目次と、エージェントの現在地の把握。 |
| `docs/ARCHITECTURE.md` | 6層の所有権モデル、垂直スライスアーキテクチャ。 |
| `docs/DESIGN.md` | トークンファースト、a11y、ダイナミックなUX。 |
| `docs/FRONTEND.md` | `local-first, promote-later`、ディレクトリ規律。 |
| `docs/PRODUCT_SENSE.md` | Identity, Memory, Curation の価値基準。 |
| `docs/QUALITY_SCORE.md` | Dirty Code 禁止、型安全、境界バリデーション。 |
| `docs/RELIABILITY.md` | 障害耐性、Isolated Error Boundaries。 |
| `docs/SECURITY.md` | 環境変数管理、境界防御、ゼロトラスト。 |

### Design Specs
- `docs/design-docs/core-beliefs.md`: 判断優先順位（Ownership > Attribute > Workflow）。
- `docs/design-docs/guardrails.md`: 安全制約、実行ガード、出力品質。
- `docs/design-docs/structure-rules.md`: ファイル配置と所有権の正本。
- `docs/design-docs/tools-boundary.md`: ツールの責務境界（Intlayer, shadcn等）。
- `docs/design-docs/memory-management.md`: 記憶の寿命（Session, Repo, Structural, Durable）。

### Operational Model (Orchestration)
- Roles:
  - Orchestrator: 計画、委譲、レビュー、統合。自身は実装しない。
  - Worker: 許可されたスコープ内での実装、検証、報告。
- Execution Contract:
  - `docs/exec-plans/active/*.md` が唯一の Source of Truth。
  - `execution-ready: true` が明記されたプランのみが Worker へ委譲可能。それ以外は「検討中のノート」として扱う。
  - すべてのプランは、`nix develop -c` で実行可能な自動検証手順を含まなければならない。
- Workflows:
  - `docs/workflows/plan-authoring-workflow.md`: 計画の下書きと昇格。
  - `docs/workflows/agent-orchestration-workflow.md`: 委譲から完了までのステートマシン。

### Technical Infrastructure
- Environment: `nix develop -c <command>` による実行環境の固定。
- Validation: `scripts/lint-docs.ts` によるリンク切れ・メタデータ欠落の検知。
- Case Memory: `docs/exec-plans/completed/*.md` に成功・失敗の証拠を永続化。

### Known Gaps (Tech Debt)
- `docs/exec-plans/tech-debt-tracker.md`: 既知の未定義事項の追跡。


## 所有権モデル (Ownership Model)

本プロジェクトは、コードの「役割」や「技術スタック」ではなく、「誰がそのコードの責任を持つか」に基づく 6 層の所有権モデルを採用している。

1. "local feature"
  1. `src/app/[locale]/.../<route>/_features/`
  - 特定のルート専用の機能
2. "promoted feature"
  1. `src/features/`
  - 複数のルートで再利用される feature
  - 横断的関心事になったときに promote する
3. "shared shell components"
  1. `src/components/shell`
  - site shell そのものを置く
  - domain workflow や route content は置かない
  2. `src/components/site-ui/`
  - Header, Footer, BreadcrumbNav, Container などサイト骨格
4. "shared site-ui components"
  1. `src/components/primitives/`
  - shadcn primitives
  - vendor-like source としてここに固定する
5. "top-level"
  1. `src/lib`
  - cross-route の pure shared logic
  2. `src/config`
  - API helper / parser / site-wide shared config, env parse, feature flag, policy, limit
6. "authored content"
  1. `src/content/`
  - MDX 等の人間が管理するコンテンツ

原則: 「再利用の事実」がない限り、コードは最も狭いスコープ（route-local）に留める。

## 5. i18n

国際化は単なるテキストの置き換えではなく、「意味（Meaning）」と「データ（Identifiers）」の分離として定義される。

- `*.source.ts`: 識別子、URL、ID 等の安定した「データ」。
- `*.content.ts`: Intlayer を通じたローカライズされた「意味（文言、説明）」。
- `*.app.ts`: データと意味を結合し、UI やメタデータが必要とする形状に「組み立てる」役割。
