---
name: tools-product-spec
description: 独立したユーティリティツール機能のための、リポジトリ固有のプロダクト仕様。
summary: /toolsルートにおけるミニアプリの境界、UIの期待値、およびアーキテクチャ上の配置を定義する。
read_when:
  - サイトに新しいツールを追加する時
  - toolsセクション内で発生するエラーを調査または解決する時
  - ウィジェットが /tools に属するか、サイトの共有UIコンポーネントかを決定する時
skip_when:
  - 一般的なレイアウトパターンやサイト全体のコンポーネントだけが必要な時
user-invocable: false
---

# Tools Product Spec

## 1. Feature Role & Scope

`/tools` セクションは、サイト訪問者（およびサイト所有者自身）が利用できる、独立した状態を持つ自己完結型のユーティリティやアプリケーションを提供する場所である。
これらは単一の目的を持つ「ミニアプリ」として機能する。

## 2. Boundaries & Placement

- **Standalone Nature**: 各ツールは自身の状態、エラーハンドリング、場合によっては独自のルーティング（ツール内ルーティング）を管理する責任がある。
- **Not a Shared Component**: 特定のページを補助する UI ウィジェット（検索バーなど）とは異なり、ツールそれ自体が目的地である。
- **Feature Encapsulation**: ツール固有のロジックやコンポーネントは、`src/features` 内の専用ディレクトリ、またはツール内部の `_components` や `_features` ディレクトリにカプセル化し、サイト規模の共有 UI に漏れ出さないようにする。

## 3. UI and Error Expectations

- **Fault Tolerance**: 一つのツールの崩壊が `/tools` コレクション全体、またはサイト全体をクラッシュさせてはならない。適切な ErrorBoundary を設けること。
- **Consistent Wrapper**: ツールの内部は多様でも、ラッパー（タイトル、説明、戻るナビゲーション）はサイトの他部分と一貫性を保つこと。

## 4. Guardrails (LLMs)

- **Do NOT** tightly couple a tool's internal state to global site state (e.g., global stores) unless absolutely necessary.
- **Do NOT** place highly specific tool utilities into `src/components/ui/` unless they are demonstrably reusable across multiple distinct parts of the site.
