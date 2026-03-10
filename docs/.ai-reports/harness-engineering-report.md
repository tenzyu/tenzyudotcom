---
name: harness-engineering-report
description: OpenAI の Harness Engineering を基準に現行リポジトリを実測評価した報告。
summary: 入口設計は整っているが、verify、CI、UI 検証、generated docs 運用が未完成であることを整理する。
read_when:
  - ハーネス改善の優先順位を決めたい時
  - 既存 docs ではなく repo の実態を確認したい時
skip_when:
  - 単一ファイルの実装だけを進める時
user-invocable: false
---

# Harness Engineering Report

## 評価方針

- OpenAI の Harness Engineering を基準にした
- `docs/*` の理想像ではなく、repo の実装と実行結果を見た

## 現状

- 入口設計は悪くない
  - `AGENTS.md` は短い目次として機能している
- 実行環境の固定もある
  - `flake.nix` で Bun と Biome を揃えられる
- 最低限の verify 入口もある
  - `verify:quick` は lint、docs lint、contract tests を束ねている
- ただし運用ループは閉じていない
  - 実行時に `docs/generated` が原因で verify が落ちた

## 問題

- docs と code の検証が一つの失敗面に混ざっている
- CI がなく、ローカルで壊れていても merge 前に自動検知されない
- UI 変更を機械的に確認するハーネスがない
- generated docs の役割が曖昧で、lint ルールと衝突している
- active plan はあるが、execution-ready plan の実運用が薄い

## 推奨

1. code verify と docs verify を分離する
2. `docs/generated` のルールを明文化し、lint と一致させる
3. GitHub Actions で `verify:quick` を必須化する
4. Playwright などで UI smoke を追加する
5. backlog と execution-ready plan を分ける

## 判断

この repo は「agent が読み始める入口」は作れているが、「agent が安全に回し続ける実行基盤」はまだ不足している。
改善対象は主に docs の追加ではなく、実行、検証、強制、観測の配線である。
