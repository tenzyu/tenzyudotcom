---
name: lint-rule-expansion-plan
description: lint で自動検知すべきルール候補を、実装手段ごとに優先順位付きで整理する。
summary: まず Biome と custom import boundary lint で取れる静的境界違反を先に実装し、取り切れない認可や registry 整合性は専用スクリプトで補完する方針をまとめる。
read_when:
  - lint を追加するとき
  - 設計ルールを自動検知へ落とし込みたいとき
  - Biome と custom lint と専用スクリプトの責務分担を見直すとき
user-invocable: false
---

# Lint Rule Expansion Plan

## Goal

既存の設計ルールのうち、レビュー頼みになっているものを lint で先回り検知する。

## Priority Order

1. `Biome`
2. custom import boundary lint
3. 既存のその他 lint 手段
4. 専用スクリプト

この順に寄せる理由は、導入コストが低く、設定が見える場所に集約され、継続運用しやすいからです。

## Candidate Rules

### 1. `process.env` direct access ban

- 対象:
  - `src/**`
- 例外:
  - `src/config/env.contract.ts`
- 理由:
  - 環境変数の読み取りを一箇所に集約しないと、機密の露出と型不整合が広がる
- 実装手段:
  - まず `Biome`
  - 足りなければ専用スクリプト

### 2. `actions.ts` / `route.ts` contract boundary

- 対象:
  - `src/app/**/actions.ts`
  - `src/app/**/route.ts`
  - `src/app/**/metadata.actions.ts`
- 禁止:
  - `*.contract.ts` への直依存
- 理想:
  - `actions.ts` は `assemble` と `session` を中心に依存する
- 実装手段:
  - custom import boundary lint

### 3. route-local `_features` cross-route import ban

- 対象:
  - `src/app/[locale]/**/_features/**`
- 禁止:
  - 別 route slice の `_features` への依存
- 実装手段:
  - custom import boundary lint

### 4. admin Server Action auth guard

- 対象:
  - `use server` を持つ admin/editor 向け action
- 必須:
  - `hasEditorAdminSession` または `requireEditorAdminSession`
- 実装手段:
  - 専用スクリプト
- 理由:
  - import の有無だけでなく、関数内部での呼び出しも見たい

### 5. editor collection registry completeness

- 対象:
  - collection descriptor
  - `EDITOR_COLLECTIONS`
  - `EditorCollectionId`
- 必須:
  - 追加漏れがないこと
- 実装手段:
  - 専用スクリプト

### 6. Next.js 16 proxy convention

- 対象:
  - `middleware.ts`
  - `proxy.ts`
- 必須:
  - `middleware.ts` を置かない
  - proxy entrypoint を規約に沿わせる
- 実装手段:
  - 既存 lint 手段か専用スクリプト

## Recommended Implementation Split

- `Biome`
  - `process.env` direct access ban
- custom import boundary lint
  - `actions.ts` / `route.ts` からの contract 直依存禁止
  - route-local `_features` の cross-route 依存禁止
- 専用スクリプト
  - admin Server Action auth guard
  - editor collection registry completeness
  - `middleware.ts` 残存検知

## Non-goals

- 設計思想全体を lint 化すること
- 低信頼な AST 判定で false positive を量産すること
- UI 文言や見た目の妥当性まで機械検知すること

## Rollout Notes

- まずは false positive が少ないルールだけを fail-fast で入れる
- 認可や registry のような文脈依存ルールは専用スクリプトで補完する
- lint 追加時は必ず fixture か test を伴わせる
