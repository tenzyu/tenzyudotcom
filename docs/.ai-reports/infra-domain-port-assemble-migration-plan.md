---
name: infra-domain-port-assemble-migration-plan
description: contract という広すぎる suffix を廃止し、infra/domain/port/assemble に責務を再配置する移行方針。
summary: env と editor storage は infra + assemble + port に分け、schema/parse は assemble、純粋ルールは domain、外部 I/O は infra に寄せる。descriptor は当面 special-case として残す。
read_when:
  - contract 命名を廃止するとき
  - DIP と storage 切替の責務を整理するとき
  - depcruise と docs を新命名に合わせて更新するとき
user-invocable: false
---

# Infra Domain Port Assemble Migration Plan

## Layer Contract

- `*.domain.ts`
  - 純粋ルール
  - 整形
  - 判定
  - 値オブジェクト
- `*.assemble.ts`
  - アプリケーションルール
  - 入力検証
  - use case 組み立て
  - 最終的な実装分岐
- `*.port.ts`
  - 抽象境界
- `*.infra.ts`
  - 外部 API
  - `process.env`
  - Blob / local file system
  - framework I/O

## Decisions

- `env` は pure ではないので `domain` ではなく `infra`
- schema / parse は `assemble`
- `descriptor` は editor registry 都合の special-case として当面維持
- Blob と local の storage 切替は `assemble` で一度だけ行う

## Concrete Migration

### Config

- `src/config/env.contract.ts` -> `src/config/env.infra.ts`

### Editor Storage

- `src/lib/editor/editor.contract.ts` を解体する
- 新構成:
  - `src/lib/editor/editor-local.infra.ts`
  - `src/lib/editor/editor-blob.infra.ts`
  - `src/lib/editor/editor.assemble.ts`
- `EditorRepository` の抽象は `editor.port.ts` に残す
- route / feature 側は concrete singleton を直接 import せず、`assemble` で受け取る

### Feature-level renames

- `src/app/[locale]/(main)/notes/_features/notes.contract.ts`
  - `notes.infra.ts`
- `src/app/[locale]/(main)/puzzles/_features/puzzles.contract.ts`
  - `puzzles.infra.ts`
- `src/app/[locale]/(main)/pointers/_features/dashboard/dashboard.contract.ts`
  - `dashboard.infra.ts`
- `src/app/[locale]/(main)/recommendations/_features/recommendations.contract.ts`
  - `recommendations.infra.ts`
- `src/features/links/links.contract.ts`
  - `links.infra.ts` + `links.domain.ts` へ分離
- `src/features/recommendations/youtube.contract.ts`
  - `youtube.assemble.ts`
- `src/features/recommendations/youtube.ts`
  - `youtube.infra.ts`
- `src/app/[locale]/(main)/blog/_features/frontmatter.contract.ts`
  - `frontmatter.assemble.ts`
- `src/app/[locale]/(main)/blog/_features/blog-frontmatter.contract.ts`
  - `blog-frontmatter.assemble.ts`

## Guardrails

- 今回は命名規則と責務の整理であり、仕様は変えない
- lint / depcruise は新 suffix に合わせて追随するが、守りたい境界自体は弱めない
- `contract` を `infra` へ単純 rename するだけでなく、validation と composition は `assemble` へ戻す

## Expected Outcome

- `contract` suffix の意味の混線が消える
- depcruise を `infra/domain/port/assemble` 前提で素直に書ける
- editor storage の Blob / local 切替が compose point 一箇所に寄る
