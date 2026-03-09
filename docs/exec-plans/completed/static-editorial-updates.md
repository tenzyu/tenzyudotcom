---
name: static-editorial-updates
description: 管理者の編集を反映しつつeditorialページを静的に保つためのケース記録。
summary: 保存時にページのレンダリングを動的にするのではなく、影響を受けるパスを明示的に再検証（revalidate）すれば、公開されているeditorialルートは静的/ISRを保つことができる。
read_when:
  - 公開されているeditorialコレクションの取得またはレンダリング方法を変更する時
  - editorial adminフォーム内の保存/公開フローを設計する時
skip_when:
  - 管理者自身のような、純粋に個人的で最適化されていないルートをレンダリングする時
user-invocable: false
---

./static-editorial-updates/body.md
