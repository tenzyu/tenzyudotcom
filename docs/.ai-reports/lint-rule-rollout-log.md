---
name: lint-rule-rollout-log
description: 追加するプロジェクト lint ルール 1-7 の実装ログと到達状態。
summary: depcruise 3件、lint-site-rules 4件を順に導入し、必要なコード寄せと例外条件を記録する。
read_when:
  - lint ルール 1-7 の進捗を確認したいとき
  - depcruise と lint-site-rules の責務分担を確認したいとき
  - lint 追加に伴うコード寄せの理由を追いたいとき
user-invocable: false
---

# Lint Rule Rollout Log

## Scope

1. `assemble` 以外から `infra` 直 import 禁止
2. `domain` / `port` から `infra` / `assemble` への逆流禁止
3. route entrypoint から `infra` 直 import 禁止
4. `EditorCollectionDescriptor` owner 固定
5. `storage` access owner 固定
6. `zod` owner 固定
7. Next server API owner 固定

## Implementation Notes

- `env.infra.ts` は外界設定の single owner だが、`site.ts` や auth/session など一部の非 assemble server module から読む必要がある
- そのため Rule 1 は `env.infra.ts` を除く一般 `*.infra.ts` を対象にする
- Rule 5 を有効にするため、blog 読み込みの file system access は `src/lib/editor/**` に寄せる
- Rule 6 を有効にするため、admin action の `zod` schema は `*.assemble.ts` 側へ移す

## Checklist

- [x] Rule 1: depcruise
- [x] Rule 2: depcruise
- [x] Rule 3: depcruise
- [x] Rule 4: lint-site-rules
- [x] Rule 5: lint-site-rules
- [x] Rule 6: lint-site-rules
- [x] Rule 7: lint-site-rules
- [x] lint / test / build 確認

## Result

- `bun run lint`: pass
- `bun test`: pass
- `bun run build`: pass
- `bun run verify:quick`: docs lint 既知不整合で fail

## Delivered Rules

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
