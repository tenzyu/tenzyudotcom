---
schema: harness/v1
kind: observation
id: observation.audit.lint-rule-rollout-log
title: Lint Rule Rollout Log
status: active
summary: import boundary lint 3件、lint-site-rules 4件を順に導入し、必要なコード寄せと例外条件を記録する。
read_when:
  - lint ルール 1-7 の進捗を確認したいとき
  - import boundary lint と lint-site-rules の責務分担を確認したいとき
  - lint 追加に伴うコード寄せの理由を追いたいとき
x:
  legacy:
    name: lint-rule-rollout-log
    description: 追加するプロジェクト lint ルール 1-7 の実装ログと到達状態。
    user_invocable: false
---

# Lint rule rollout log

## 対象ルール

1. `assemble` 以外から `infra` 直 import 禁止
2. `domain` / `port` から `infra` / `assemble` への逆流禁止
3. route entrypoint から `infra` 直 import 禁止
4. `EditorCollectionDescriptor` owner 固定
5. `storage` access owner 固定
6. `zod` owner 固定
7. Next server API owner 固定

## 実装上の制約

- `env.infra.ts` は外部設定の唯一の所有元である。ただし `site.ts` や auth/session など、一部の assemble 以外のサーバーモジュールも参照する必要がある
- Rule 1 の対象は `*.infra.ts` とし、`env.infra.ts` を除外する
- Rule 5 を有効にするため、blog 読み込み時のファイルシステムアクセスは `src/lib/editor/**` に移す
- Rule 6 を有効にするため、admin action の `zod` schema は `*.assemble.ts` に移す

## 実装状況

- [x] Rule 1: custom import boundary lint
- [x] Rule 2: custom import boundary lint
- [x] Rule 3: custom import boundary lint
- [x] Rule 4: lint-site-rules
- [x] Rule 5: lint-site-rules
- [x] Rule 6: lint-site-rules
- [x] Rule 7: lint-site-rules
- [x] lint / test / build 確認

## 検証結果

- `bun run lint`: 成功
- `bun test`: 成功
- `bun run build`: 成功
- `bun run verify:quick`: 既知の docs lint 不整合により失敗

## 導入済みルール

### Rule 1

- `env.infra.ts` を除く一般 `*.infra.ts` は `*.assemble.ts` / `*.infra.ts` からのみ参照可能

### Rule 2

- `*.domain.ts` / `*.port.ts` から `*.infra.ts` / `*.assemble.ts` への逆流禁止

### Rule 3

- route entrypoint (`page.tsx`, `layout.tsx`, `route.ts`, `actions.ts`, `*.actions.ts`) から `*.infra.ts` 直 import 禁止

### Rule 4

- `EditorCollectionDescriptor` の owner 宣言は `src/features/editor-collections/` に限定

### Rule 5

- `storage` への file access は `src/lib/editor/` owner に限定

### Rule 6

- `zod` の owner は `*.assemble.ts` と `src/features/editor-collections/` に限定

### Rule 7

- `next/cache`, `next/headers`, `next/navigation` は `src/app/` または `*.assemble.ts` に限定

## 所有元の変更

- owner tree spec は `harness/observations/audits/app-ownership-tree-spec.md` に記録済み
- `src/components/shell/*`
- `src/components/site-ui/page-header.tsx`
- `src/components/site-ui/section-header.tsx`
- `src/components/site-ui/otaku-aside.tsx`
- `src/components/site-ui/section.tsx`
- `src/components/site-ui/content.tsx`
- `src/components/site-ui/external-link.tsx`
- `src/features/admin/*`
- `src/features/youtube/*`

上記の対象は owner 指定から外した。記録時点では allowlist なしで `bun run lint-symbol-ownership` が成功している。
