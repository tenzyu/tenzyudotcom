---
name: harness-summary
description: 現行ハーネスの状態を短く確認するための generated 要約。
summary: 入口、実行、検証、未整備ポイントを最小限の情報に圧縮したサマリー。
read_when:
  - ハーネスの現状を短く把握したい時
skip_when:
  - 詳細な差分や改善案まで必要な時
user-invocable: false
---

# Harness Summary

## 現在あるもの

- `AGENTS.md` による入口
- `flake.nix` による実行環境固定
- `package.json` の `verify:quick` / `verify`
- `scripts/lint-docs.ts` による docs lint
- `zod` ベースの contract 実装

## 足りないもの

- CI による自動強制
- UI 自動検証
- generated docs の明確な運用境界
- すぐ委譲できる execution-ready plan の継続在庫

## 先にやること

1. verify を分離する
2. docs/generated の扱いを決める
3. CI を追加する
4. UI smoke を追加する
