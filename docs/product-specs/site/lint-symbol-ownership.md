---
title: lint symbol ownership
description: exported symbol が本当に shared かどうかを owner 単位の参照事実で判定し、demote 候補を検出する linter の仕様
---

# Lint Symbol Ownership

## References
- [](/docs/design-docs/rules/dependency-inversion.md)
- [](/docs/design-docs/AGENTS.md)

## Goal

`const` と `function` の exported value symbol を単位に、「本当に複数 owner から共有されているか」を静的解析で判定する。

`src/features/**` や `src/lib/**` にある symbol が、実際には 1 つの route / feature からしか使われていないなら、shared と見なさず demote 候補として報告する。

逆に `src/app/**/_features/**` の exported symbol が別 owner から参照されているなら、promote 候補として報告する。

## Requirements

- TypeScript の symbol 解決に基づいて exported symbol 単位の参照を集計する
- file 単位ではなく declaration 単位で判定する
- 少なくとも以下の declaration kind を対象にする
  - `const`
  - `function`
- 初期版では以下の layer 定義ファイルを対象外にする
  - `*.infra.ts`
  - `*.domain.ts`
  - `*.port.ts`
  - `*.assemble.ts`
  - `*.data.ts`
- 参照元は owner に正規化して数える
- owner は少なくとも以下を区別できる
  - route-local owner
    - `src/app/[locale]/(main)/notes`
    - `src/app/[locale]/(main)/blog/[slug]`
    - `src/app/[locale]/(admin)/editor`
    - などの route root
  - shared owner
    - `src/features/<domain>`
    - `src/lib/<domain>`
    - `src/config`
- `src/features/**` と `src/lib/**` の exported symbol について:
  - 参照 owner が 0 または 1 なら `demote` 候補として報告する
- `src/app/**/_features/**` の exported symbol について:
  - 別 owner から参照されていたら `promote` 候補として報告する
- 同一 file 内の自己参照は owner として数えない
- test / spec からの参照は owner として数えない
- type-only import は初期版では共有事実として数えない
- `type` `interface` `class` `enum` は初期版の判定対象外にする
- CLI として実行でき、machine-readable な結果を返せる
- 問題がある場合は非 0 exit code にする

## Non-goals

- auto-fix
- import 文の自動書き換え
- barrel export の全面的な整理
- JavaScript file まで含めた完全対応

## Guardrails (LLMs)

- route owner の判定を regex 1 本で雑に済ませない
- file 依存ではなく symbol references を使う
- import boundary lint の代替ではなく補完として実装する
- false positive を減らすため、最初は value symbol を優先し、type-only import は無視する
