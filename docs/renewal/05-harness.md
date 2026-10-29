# ハーネスの採否

## 現物と衝突

- `AGENTS.md` はAtelier目標を強制。`opencode.json` の goal はAtelier coordinator固定で、Atelier MCPもenabled。
- `.codex/config.toml` にSerena、Nx MCP、Atelier MCP、別モデル指定。global OpenCode指示はgraph優先、Serenaは別の探索・編集優先を要求する。重複した読み込みと規約の選別が必要になる。
- `.agent`、`.agents`、`.claude` に実体とsymlinkが混在。インベントリはsymlinkを追わず別記した。複数コピーの同一性・全skillの実利用頻度は未測定。
- このrunでgraph、Serena、CLI、Playwrightを使用した。graph検索の文字化け表示やroute候補の誤検出は、実ソースと照合して補正した。検索結果だけを証拠の正本にしない。

## 一次資料の確認（2026-10-29）

|資料|採る規律|導入しないもの・制約|
|---|---|---|
|[Agent Skills specification](https://agentskills.io/specification)|name/descriptionのmetadata、必要時に本文とresourcesを読む、短いSKILL.md|allowed-toolsはexperimental。permission enforcementの代わりにしない|
|[公式 cursor/plugins pstack](https://github.com/cursor/plugins/tree/main/pstack)|小さい検証単位、判断ログ、独立レビュー、役割分担|全skill自動導入、未監査scriptの実行、自動merge、Cursor固有automation|
|同READMEのClaude adapter説明|harnessごとの機能差を明示する|OpenCodeに同じplugin名・subagent名があるとは仮定しない|

今回、新しいpstack一式やMCPをインストールしていない。既存skillsの利用と公開一次資料の確認を行った。取得したmainの資料は将来変わるため、正式採用前にcommitを固定し、script・権限・外部通信を監査する。

## 最小運用案

共通指示は目的、資産保全、承認境界、検証commandへのリンクに絞る。専門skillは必要時だけ開く。探索用browser操作と、回帰判定用Playwright Testは別扱いにする。

|担当|入力と編集権限|成功条件|
|---|---|---|
|強いモデル / 主担当|仕様差分、依存、証拠。製品設計・削除は承認へ|本人判断と技術判断を分離し、実行証拠で報告|
|限定実装モデル|対象fileリスト、入出力契約、禁止path、実行テスト|テスト成功、範囲外変更なし、独立レビュー|
|評価担当|diff、ログ、再現command。read-only|誤った完了主張を指摘。未実行をpassにしない|

実測したモデル別タスク成功率・料金・人間拘束時間・トークン削減率はない。役割表は設計案であり、モデルの性能評価結果ではない。

## 今回追加した機械検証

`repo-ops/renewal/run.mjs` はcommand、終了値、timeout、ログSHAを記録する。環境変数をallowlistに限定し、既存証拠の上書きを拒否する。任意commandを隔離するsandboxではない。読み取り専用資格情報すら不要なevaluationコピーで実行した。

`inventory.mjs` と `catalog.mjs` は所在と仮分類を作る。機械分類を本人承認と取り違えない。`preview.mjs` はlocalhostの一時portで起動し、routeごとに別pageを使い、画像・trace・console・network失敗を保存する。正式なE2E全体の代替ではない。

## 次の検証単位の文脈予算見積もり

locale / preview障害の修正を次の独立単位とした、未校正の計画見積もり。実使用量や節約率ではない。

|シナリオ|想定|input・output・再試行を含む概算tokens|
|---|---|---|
|小|routing設定の局所不整合で再現testがすぐ成立|2万〜4万|
|中|IntlayerとNextの境界調査、browser再測定、独立review|5万〜10万|
|大|複数設定・依存versionの相互作用で小さな実験を繰り返す|12万〜25万|

プロダクト全体の完了費用は、ページ採否とneko7環境が未決のため未見積もり。次のrunで実測値と比較し、単位を広げずに更新する。
