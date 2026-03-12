---
title: "detect local-first, promote-later, dependency-inversion violations"
description: "local-first, promote-later 違反と dependency-inversion 違反を検知できるようにする。"
---

# The Linter for Detecting Local-First, Promote-Later, and Dependency-Inversion Violations

## References

- [](/design-docs/rules/path-feature-semantics.md)
- [](/design-docs/rules/dependency-inversion.md)
- [](/design-docs/rules/local-first-promote-later.md)

## Goal

local-first, promote-later 違反を検知できるようにする。
dependency-inversion 違反を検知できるようにする

## Requirements

- `bun run lint` で local-first, promote-later, dependency-inversion 違反を検知できるようにする。
- 依存関係の解析およびルール評価のツールとして custom import boundary lint を採用する。
- 例外設定（`*.test.ts` などの検査除外や特定の意図的な違反）は、コード内のインラインコメントではなく lint スクリプト内で管理する。

## Implementation Details

- **Tooling**: custom import boundary lint を使用し、依存関係グラフの構築とルール違反の検知を行う。
- **Integration**: `package.json` の `lint` スクリプトに custom lint の実行を含める。
- **Rule Definitions (`scripts/lint-import-boundaries.ts`)**:
  - **Local-first, Promote-later**:
    - `src/features/` 配下のモジュールが1つのルート/機能からしか参照されていない場合（昇格の条件を満たしていない）に警告するルール。
    - `src/app/.../_features/` 配下のモジュールが他のルートから参照されている場合（共通化すべき状態）に警告するルール。
  - **Dependency Inversion**:
    - UI層（`*.tsx`等）がインフラ層の実装（`*.infra.ts`）に直接依存することを禁止する。
    - ドメイン層（`*.domain.ts`）やポート（`*.port.ts`）が、外側の層（`*.infra.ts`, `*.assemble.ts`）に依存することを禁止する。

## Non-goals

- VSCODE 上でリントエラーを表示する

## Guardrails (LLMs)
