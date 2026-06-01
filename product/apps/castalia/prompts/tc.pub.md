---
id: tc.pub
title: Thinking Compiler - Public Output Converter
aliases: pub,public,convert
tags: thinking-compiler,writing,publish
mode: form
slots:
  - name: source
    label: 元のメモ・会話・思想・設計
    multiline: true
    required: true
---
Public Output Converter を実行して。

対象:
---
{{source}}
---

出力先候補:
- X
- blog
- README
- ARCHITECTURE.md
- issue
- PR description
- tenzyu.com page
- private note

条件:
- 出力先ごとに文体と情報量を変える
- 短く済むものを長文化しない
- 公開する価値がないものは private note に送る
- 技術文書にする場合は、再現手順・判断基準・非目標を入れる
- 思想文にする場合は、主張・批判対象・価値・実践方法を分ける

出力:
1. 最適な出力先
2. 公開可否
3. 変換後の文章
4. 足りない情報
5. 公開前チェックリスト
