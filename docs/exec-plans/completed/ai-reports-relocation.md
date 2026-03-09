---
name: ai-reports-relocation
description: 作業済みタスク：ai-reports ディレクトリの再配置と整理。
summary: 具体的な成否に関わらない仕様書を repo-specific 等へ移動させ、ディレクトリの役割を最適化した経緯。
read_when:
  - LLM向けレポートの過去のドキュメント最適化経緯を調べる時
skip_when:
  - プロダクトのコードを修正している時
user-invocable: false
---

# AI Reports Relocation

- `./ai-reports` の、具体的な失敗/成功じゃないもの（例えば repo-specific な仕様とか）は、 `./repo-specific` に移動した。
- `./ai-reports` はディレクトリ名からその正体がわかりにくいので、適切な名前を提案してもらい変更した。
- `./ai-reports` の運用方法について、本文に参照の相対パスのみを設置して、frontmatterには「いつ参照を読みに行くべきなのか」と「要約」を記載した。またLLMの摩擦を減らす内容を記述して、直下ディレクトリに本文をまとめた。
- `./ai-reports` は harness 配下に移動した。
- この運用方法を `README.md` に記載し、以後のLLMアプローチでの迷いを解消した。
