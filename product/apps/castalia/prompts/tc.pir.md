---
id: tc.pir
title: Thinking Compiler - Pre-Implementation Review
aliases: pir,review,impl-review
tags: thinking-compiler,implementation,review
mode: form
slots:
  - name: change
    label: 変更内容
    multiline: true
    required: true
---
Pre-Implementation Review を実行して。

これから入れようとしている変更:
---
{{change}}
---

前提:
- 実装前に、設計破綻・責務の混線・将来拡張の邪魔・依存増加・説明不能性を検出したい。
- ただ動けばよい、ではなく、後から README / ARCHITECTURE.md に説明できる構造にしたい。
- 必要なら、採用案・却下案・保留案に分けて。

評価観点:
1. 責務境界
2. 将来の拡張性
3. 依存増加の正当性
4. キャッシュ/ビルド効率
5. 運用コスト
6. LLM が将来読んでも理解できるか
7. ドキュメント化可能か
8. 捨てるべき複雑性が混じっていないか

出力:
- 結論
- 採用してよい部分
- 危険な部分
- 代替案
- 実装前に決めるべきこと
- 最小差分で進める案
- 完了条件
