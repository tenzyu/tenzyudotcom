---
id: tc.ps
title: Thinking Compiler - Problem Split
aliases: ps,split,debug
tags: thinking-compiler,debug,triage
mode: form
slots:
  - name: symptom
    label: 現象
    multiline: true
    required: true
  - name: previous_action
    label: 直前にしたこと
    multiline: true
    required: true
  - name: expected
    label: 期待していたこと
    multiline: true
    required: false
---
Problem Split を実行して。

現象:
---
{{symptom}}
---

直前にしたこと:
---
{{previous_action}}
---

期待していたこと:
---
{{expected}}
---

出力:
1. まず事実と推測を分離
2. 問題領域を分類
   - 設計問題
   - 実装問題
   - 設定問題
   - 依存問題
   - キャッシュ問題
   - 環境問題
   - 一時的障害
3. 最も可能性が高い原因
4. 可能性が低いが確認すべき原因
5. 最初に実行する確認コマンド
6. 次に実行する確認コマンド
7. 触ってはいけない場所
8. 解決後に残すべきメモ
