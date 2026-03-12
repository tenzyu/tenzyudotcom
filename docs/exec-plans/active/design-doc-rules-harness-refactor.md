---
name: design-doc-rules-harness-refactor
description: docs/design-docs のルール再編と docs lint の再設計を、番号ごとのレビューゲート付きで進める
summary: rule の分解、境界整理、prefix 付与、密結合ルールの統合、reference markdown 導入、lint-docs から lint-rules への改名を段階実行する
read_when:
  - docs/design-docs/rules を template 準拠で再編するとき
  - docs lint の責務を rules 配下へ絞りたいとき
  - linter error message から参照先 rules を読めるようにしたいとき
execution-ready: true
---

# Design Doc Rules Harness Refactor

## Goal

`docs/design-docs/AGENTS.md` と `docs/design-docs/rules/*.md` を、短いコンテキストで追える構造へ再編する。各ルールは `_template.md` 準拠で境界と prefix が明示され、密結合なルール群は過不足なく統合され、各種 linter のエラーメッセージから参照すべき `references` markdown へ到達できる状態にする。

## Scope

- `docs/design-docs/**`
- `docs/exec-plans/active/design-doc-rules-harness-refactor.md`
- `scripts/lint-docs.ts`
- `scripts/lint-docs.test.ts`
- `scripts/lint-site-rules.ts`
- `scripts/lint-symbol-ownership.ts`
- `scripts/lint-import-boundaries.ts`
- `scripts/lint-no-reexport.ts`
- `package.json`

## Deliverables

- 番号ごとにレビュー可能な実行計画
- `_template.md` 準拠に再編された `docs/design-docs/rules/*.md`
- 境界と責務が明示された rule prefix 命名
- 統合後の rule 群と更新済み `docs/design-docs/AGENTS.md`
- `docs/design-docs/references/*.md`
- reference markdown を案内する linter error message
- `scripts/lint-rules.ts` とその test / script rename

## Task Breakdown

1. `rules/*.md` の棚卸しを行い、現行 rule を boundary ごとに分類し、prefix 命名規則を定義する
2. ルール本文を `_template.md` 形式へ寄せるための分解方針を決め、長文 rule を「思想」「実装」「制約」に切り分ける
3. boundary を跨いでいる rule を是正し、prefix を付与して rename する
4. 密結合前提でまとめて読ませるべき rule を統合する
5. `docs/design-docs/AGENTS.md` を新しい prefix / grouping 前提で再編する
6. `docs/design-docs/references/*.md` を追加し、各 linter のエラーから読むべき参照先を定義する
7. `scripts/lint-docs.ts` を rules 専用に絞って `scripts/lint-rules.ts` へ改名し、関連 test と `package.json` scripts を更新する
8. `lint:docs` 相当の検証を再実行し、常時グリーン化に必要な docs/rules 修正を完了させる

## Execution Slices

### Slice 1

- inventory と boundary map を作る
- prefix taxonomy を定義する
- 統合候補と分割候補を一覧化する
- この slice では rule 本文の大規模 rename / 統合はまだ行わない

### Slice 2

- foundations / architecture 系 rule を template 準拠へ再編する
- dependency inversion, ownership, vertical slice, local-first 周辺の重複を圧縮する

### Slice 3

- admin gate / proxy / editor security / impl 系 rule を統合再編する
- 言葉とコードが過多な rule を分割または圧縮する

### Slice 4

- AGENTS index と references markdown を整備する
- linter error message を reference 誘導型へ更新する

### Slice 5

- `lint-docs.ts` を `lint-rules.ts` に改名する
- 責務を rules 配下に限定し、test と package scripts を更新する
- 最終 verification を通す

## Review Gates

- 各 slice の完了後にユーザー確認を待つ
- 次の slice へは、直前 slice の差分が承認されてから進む
- 1 slice あたりの差分は「人間が rule の統合妥当性を判断できる量」に抑える

## Slice 1 Working Notes

### Current Status

- in progress
- 目的は「全面改修」ではなく、次の差分で迷わない inventory と rename 方針を固定すること

### Proposed Prefix Taxonomy

- `foundation-`: ownership, layering, dependency inversion, vertical slice, placement rules
- `security-`: auth, session, proxy, outbound, env, overwrite, private editor safety
- `impl-`: 実装時の具体制約、mount point 規約、UI assembly 規約、route handling 規約
- `design-`: token, a11y, composition など UI/UX 設計
- `intelligence-`: harness, memory, decision order, role separation
- `reliability-`: metadata safety, fault tolerance
- `guard-`: mutation / verification の横断ガード
- `product-`: product values, authored content, normative target
- `cli-`: terminal / path quoting rules

### Boundary Inventory

- foundation cluster
  - `foundation-owner-placement-layers.md`
  - `foundation-promotion-by-usage.md`
  - `foundation-feature-slice-structure.md`
  - `foundation-tool-boundaries.md`
  - `foundation-dependency-inversion.md`
  - `impl-file-role-contract.md`
  - `impl-actions-mount-through-assemble.md`
  - `impl-apply-di-before-ui-assembly.md`
- security cluster
  - `admin-editor-security.md`
  - `security-editor-auth-credentials-should-have-a-single-owner.md`
  - `security-server-actions-require-auth-even-for-helper-actions.md`
  - `security-explicit-env-parsing.md`
  - `security-outbound-boundary.md`
  - `thin-proxy-pattern.md`
  - `mdx-overwrite-protection.md`
- implementation cluster
  - `admin-gate-pattern.md`
  - `admin-gate-is-stable-contract.md`
  - `impl-do-not-change-admin-gate-without-explicit-approval.md`
  - `impl-preserve-public-ui-before-admin-convenience.md`
  - `impl-avoid-route-post-and-hard-reload-for-inline-admin.md`
  - `impl-leaf-admin-affordance-is-better-than-large-admin-scope.md`
  - `impl-no-page-level-collection-wrapper.md`
  - `no-page-level-admin-collection-component.md`
  - `logic-presentation-separation.md`
  - `contract-boundary-validation.md`
  - `editor-collection-registration-contract.md`
  - `impl-editor-errors-and-blog-saving-should-cross-boundaries-via-port.md`
  - `nextjs-16-proxy.md`
  - `use-proxy-instead-middleware.md`
  - `routing-conventions.md`
  - `next-intlayer-entrypoint-contract.md`
- design cluster
  - `design-token-first.md`
  - `design-a11y-default.md`
  - `composition-patterns.md`
  - `locale-switcher-single-flow.md`
  - `performance-optimization.md`
- intelligence / product / guard cluster
  - `harness-engineering.md`
  - `memory-layers.md`
  - `decision-priority-order.md`
  - `editor-role-separation.md`
  - `product-core-values.md`
  - `normative-target-over-current.md`
  - `authored-content-management.md`
  - `guard-structural-mutation.md`
  - `guard-verification.md`
  - `i18n-meaning-vs-data.md`
  - `quote-path-command.md`
  - `reliability-metadata-safety.md`
  - `reliability-fault-tolerance.md`
  - `no-dirty-code.md`

### Initial Consolidation Candidates

- admin gate pack
  - merge target: `impl/admin gate` の読む順でまとまる単位
  - source candidates:
    - `admin-gate-pattern.md`
    - `admin-gate-is-stable-contract.md`
    - `impl-do-not-change-admin-gate-without-explicit-approval.md`
    - `impl-preserve-public-ui-before-admin-convenience.md`
    - `impl-leaf-admin-affordance-is-better-than-large-admin-scope.md`
- inline editor flow pack
  - source candidates:
    - `impl-avoid-route-post-and-hard-reload-for-inline-admin.md`
    - `impl-no-page-level-collection-wrapper.md`
    - `no-page-level-admin-collection-component.md`
    - `editor-collection-registration-contract.md`
- proxy boundary pack
  - source candidates:
    - `thin-proxy-pattern.md`
    - `use-proxy-instead-middleware.md`
    - `nextjs-16-proxy.md`
    - `security-outbound-boundary.md`
    - `contract-boundary-validation.md`
- dependency inversion pack
  - source candidates:
    - `foundation-dependency-inversion.md`
    - `impl-file-role-contract.md`
    - `impl-apply-di-before-ui-assembly.md`
    - `impl-actions-mount-through-assemble.md`
    - `impl-editor-errors-and-blog-saving-should-cross-boundaries-via-port.md`
    - `logic-presentation-separation.md`
- ownership pack
  - source candidates:
    - `foundation-owner-placement-layers.md`
    - `foundation-promotion-by-usage.md`
    - `foundation-feature-slice-structure.md`

### Split Candidates

- `admin-editor-security.md`
  - 問題: session, validation, overwrite protection が一枚に同居している
  - 候補: `security-editor-session`, `security-editor-input-boundary`, `security-editor-overwrite-protection`
- `foundation-dependency-inversion.md`
  - 問題: 実装規約へ寄せすぎると思想 rule が again 長くなる
  - 対応: `impl-file-role-contract.md` に suffix contract を分離する

### Slice 1 Exit Criteria

- prefix taxonomy に対して明らかな例外が残っていない
- 統合候補と分割候補が次 slice の差分単位として扱える粒度になっている
- rename / merge を始める前に、ユーザーが妥当性を判断できる状態になっている

## Slice 2 Working Notes

### Current Status

- completed
- foundation / ownership / dependency inversion 周辺のみを再編した
- file 総数はこの slice 単体では `9 -> 8` に留め、過統合を避けた

### Applied Merges

- `ownership-model-layers.md` + `directory-strictness.md`
  - `foundation-owner-placement-layers.md`
- `path-feature-semantics.md` + `vsa-vertical-slices.md`
  - `foundation-feature-slice-structure.md`

### Applied Splits

- `dependency-inversion.md`
  - `foundation-dependency-inversion.md`
  - `impl-file-role-contract.md`

### Applied Renames

- `local-first-promote-later.md`
  - `foundation-promotion-by-usage.md`
- `tool-boundary-ownership.md`
  - `foundation-tool-boundaries.md`
- `foundation-actions-ts-must-depend-on-assemble-and-session-only.md`
  - `impl-actions-mount-through-assemble.md`
- `impl-apply-dependency-inversion-before-ui-assembly.md`
  - `impl-apply-di-before-ui-assembly.md`

### Deliberately Deferred

- `logic-presentation-separation.md`
  - implementation cluster との重なりはあるが、slice 3 で editor / admin 実装群と一緒に扱う
- `docs/product-specs/**` と `docs/workflows/**` の古い rule link
  - 現在の guardrail では作業スコープ外なのでこの slice では更新していない

### Slice 2 Exit Criteria

- foundation cluster の file 名に prefix が付いている
- ownership / feature slice / dependency inversion の rule が短く読み分けられる
- dependency inversion の思想説明と file role contract が別 rule になっている

## Guardrails

- `lint-docs` 以外の既存 linter は、error message 変更以外のルールロジックを変えない
- `docs/design-docs/_template.md` の書式は変えない
- 作業スコープを `docs/design-docs/` と `scripts/` から外さない
- rule の削除は行わず、削除が必要なら根拠を示してユーザー確認を取る
- 言葉とコードが同時に多い rule は、統合ではなく再分割も含めて解消する
- 統合率は保守的に扱い、rule file 総数は現状の約 `2/3` 程度を下限目安とする
- 現状の約 `1/3` 近辺まで圧縮する統合案は過統合とみなし、採用しない

## Subagent Contract

- plan path: `docs/exec-plans/active/design-doc-rules-harness-refactor.md`
- allowed file scope:
  - `docs/design-docs/**`
  - `docs/exec-plans/active/design-doc-rules-harness-refactor.md`
  - `scripts/lint-docs.ts`
  - `scripts/lint-docs.test.ts`
  - `scripts/lint-site-rules.ts`
  - `scripts/lint-symbol-ownership.ts`
  - `scripts/lint-import-boundaries.ts`
  - `scripts/lint-no-reexport.ts`
  - `package.json`
- required verification:
  - `bun test scripts/lint-docs.test.ts`
  - `bun run lint:docs`
  - `bun run lint`
- expected return format:
  - changed files
  - slice number completed
  - rule inventory / consolidation summary
  - verification result
  - remaining decisions for user review

## Verification

- `bun test scripts/lint-docs.test.ts`
- `bun run lint:docs`
- `bun run lint`
- rename 後は `bun test` の関連 case が green であること

## Completion Signal

- すべての rule が `_template.md` 準拠で、boundary と prefix が一意に読める
- 密結合前提な rule 群が適切に統合され、言葉もコードも多すぎる rule が残っていない
- `docs/design-docs/references/*.md` から linter error の修正導線を辿れる
- `scripts/lint-rules.ts` へ rename された docs/rules lint が green である
