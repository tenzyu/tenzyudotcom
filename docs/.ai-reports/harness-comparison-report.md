---
name: harness-comparison-report
description: OpenAI の Harness Engineering と現行リポジトリの差分を実測ベースで整理した比較メモ。
summary: docs の主張ではなく、実コード、設定、実行結果を基準に一致点、差分、優先アクションを要約する。
read_when:
  - OpenAI の Harness Engineering と現状の差分を短く確認したい時
  - 次に投資すべきハーネス改善を決めたい時
skip_when:
  - 個別機能の実装だけを進める時
user-invocable: false
---

# Harness Comparison Report

## 基準

- 比較対象は OpenAI の [Harness engineering](https://openai.com/ja-JP/index/harness-engineering/)
- 評価は `docs/*` の主張ではなく、実際のコード、設定、実行結果を優先する

## 一致している点

- `AGENTS.md` が短い目次として機能している
- `flake.nix` と `package.json` でローカル実行入口が定義されている
- `scripts/lint-docs.ts` で docs の frontmatter、到達性、orphan、execution-ready plan の最低契約を検査している
- `src/config/env.contract.ts` や各 `*.contract.ts` で入力境界を parse する実装がある

## 差分

- verify ループが閉じていない
  - `nix develop -c bun run verify:quick` は `docs/generated` の frontmatter 不足と orphan で失敗した
- CI がない
  - `.github/workflows/` が見当たらず、verify が PR で自動強制されていない
- UI 自動検証がない
  - `react-grab` overlay はあるが、Playwright などの再現可能な UI smoke がない
- execution-ready plan の実働在庫が薄い
  - active plan はあるが、即委譲できる plan を確認できなかった
- docs/generated の運用境界が曖昧
  - 正式な知識ベースなのか、作業メモなのかが rules と一致していない

## 優先アクション

1. `verify` を `code-verify` と `docs-verify` に分ける
2. `docs/generated` を lint 対象に含めるか外すか決め、運用を一本化する
3. GitHub Actions で `nix develop -c bun run verify:quick` を必須化する
4. UI smoke を Playwright などで追加する
5. backlog note と execution-ready plan を物理分離する

## 要約

この repo は knowledge map は持っているが、execution harness はまだ薄い。
次に強化すべきなのは docs の量ではなく、CI、verify 分離、UI 自動検証、機械 enforcement である。
