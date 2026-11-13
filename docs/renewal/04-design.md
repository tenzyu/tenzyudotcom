# 情報設計と表示の初期評価

## 確認した表示

Chromium 155、Playwright 1.59.1、1440px / 390px。`/ja/tools` は200だが英語のTools画面になった。現在の `intlayer.config.ts` は日本語default、`prefix-no-default`。requested URLとfinal URLを別々に記録した。

PC画面では上下に重複するナビ、広い空白、予定の説明が実働ツールより先に現れる。スマホでも同じ階層が長く続く。documentの横幅超過を両幅で検出した。画像だけからCSSの原因は断定しない。

スクリーンショットとtraceは Vault の `evidence/` に保存する。開発時のエラーoverlayを含む。正常な本番画面の証拠ではない。

## 最小route案 — AI提案

|route|役割|既存資産|
|---|---|---|
|`/`|tenzyuの活動をosuとengineeringの二軸で示す|紹介・外部活動リンク|
|`/osu`|現在の活動、選定したプレイ、設定、日付付き履歴|旧osu-profile・osu記事|
|`/engineering`|問題→作ったもの→結果→根拠の作品一覧|portfolio・tools・制作記事|
|`/blog/[slug]`|記録・説明の安定URL|MDXとfrontmatter|
|既存URLのredirect|外部リンクを保護する|links shortURL・archive・旧一覧|

言語URLは現行方式の意図を確認してから変更する。上表は概念routeであり、locale採用の決定ではない。

## 比較する意匠の方向

1. **記録中心**: 日付・プレイ・制作記録の編集された時系列。装飾より一次記録。
2. **二軸の索引**: osu / engineering を同じ強さで並べ、詳細へ短く到達。
3. **作品中心**: 代表プレイと代表制作を先に見せ、その下に記録を置く。

これはPhase 1の比較軸。2〜3案の画面プロトタイプ、採用判断、視覚回帰基準は未作成。現行カードの配色を変えるだけで刷新完了とは扱わない。
