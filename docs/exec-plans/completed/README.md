---
name: harness-cases
description: harnessルールに昇格させるべきではない、具体的なケース、証拠、および運用のトレードオフのためのエントリーポイント。
summary: 具体的な成功例、失敗例、および証拠に基づいた戦略メモのためにこのサブディレクトリを使用する。
read_when:
  - アーキテクチャ上の決定の背景にある歴史的なトレードオフや証拠を探す時
  - 特定のストレージやメタデータ技術がなぜ現在好まれているかの「理由」を検討する時
skip_when:
  - 厳密な構造ルールや高レベルな境界を探している時（それらは参照にある）
user-invocable: false
---

# Cases

このディレクトリは、harness に昇格させない具体知を置く。
top-level file は入口カードとして扱い、本文は子ディレクトリへ逃がす。

## What Belongs Here

- 具体的な成功条件
- 失敗要因
- 検討して捨てた分岐
- 実装に紐づく tradeoff
- source 付きの運用メモ

## What Does Not Belong Here

- repo-wide rule
- path placement の第一候補
- guard の正規ルール
- product spec や repo 固有の恒久仕様

それらは `docs/harness/references` または `docs/harness/repo-specific` に置く。

## Structure & Operation Expectations

ケース記録は、ディレクトリ構成と運用の判断を検証するための現場メモであることを忘れない。
具体的には:

- トップレベルファイルは frontmatter + 相対パスだけにし、本文は `./<slug>/body.md` のような子ディレクトリに置く。
- 実装に紐づく運用の流れ、実際に出た摩擦、矛盾した指示を短く箇条書きで残す。
- 次に同じ状況が来たときに「今回は existing code を precedence としない」と宣言したい場合、その宣言と背景をこのケースに書き込む。
- ルール化できるなら `docs/harness/references`へ引き上げるが、まだ一本化できない場合の仮の operational workaround をここに残す。

こうすることでケースディレクトリは「構造と運用の妥当性をチェックするための lightweight archive」になり、腐らせずに意思決定の元ネタを保持できる。
