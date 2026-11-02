# 再建の完了記録

2026-11-02の追加指示に基づくローカル統合の記録。製品実装のbuildとunit検証対象は `77b05583e72e618b8266417673c378479d687402`、browser検証の最終対象は `bf75057de11349146ba2fbd93106a9f0bf05f5ce`。両者の製品runtimeソースに差分はない。初回観測の未承認表は履歴として残す。

## 実装と修正

- 承認済みのAtelier、Castalia、pointers、puzzles、recommendations、旧ハーネス、archivesの実行導線を撤去した。
- blog、notes、scraps、links、toolsを残し、Homeでosu!とengineeringを紹介する。共通の見た目とcompositionは `@tenzyu/ui/editorial` が所有する。
- `/osu` は実APIのプロフィールとスコアを表示する。設定は2026を初期選択し、2025以前へ切り替えられる。新PCは提供済みの機種名のみを表示する。keypadとtabletを保持し、年間目標を撤去した。
- 日本語URLの内部rewriteで末尾スラッシュのredirectが循環しないよう修正した。明示的な `/ja` の選択をcookieへ保存し、英語headerに上書きされないようにした。
- Base UIのリンクとbuttonの指定、YouTube dialog trigger、paginationのhydrationを修正した。
- Homeの未使用selfie実装とTweet IDの参照を撤去した。osu!側は公開Tweetの省略された空entity配列を境界で正規化して描画する。
- editorはGitHubの単一コミットでscrapsを保存する。下書き保持、競合拒否、翻訳元versionの確認を行う。共通scraps処理を `src/features/scraps` へ移し、公開側とeditorが利用する。
- 公開停止と本文更新が重なると新しい下書きが読める競合を独立レビューで再現し、修正した。公開読み取りはmanifest、メタデータ、本文を同じ不変コミットから取得する。実際のeditor commandを並行実行する回帰テストで確認した。
- NixOSの初期化済みprofile markerが検証runnerで落ちてPATHが消える問題を修正した。共有UIの外部状態は `useSyncExternalStore` で購読する。ESLintは生成物を除外し、Vite専用Fast Refresh検査を実際のVite appへ限定した。

## 最終検証

証拠の基準ディレクトリは `/home/tenzyu/Projects/tenzyudotcom-renewal-safety-20261101/final-20261102/`。秘密なしの検証worktreeで実行し、外部コンテンツへの書き込みは行っていない。

|確認|結果|基準ディレクトリからの証拠パス|
|---|---|---|
|NixとNx経由のWeb production build、依存UIとlinter build|成功、page data収集を含む|`final-web/result.json`、`final-web/output.log`|
|WebとUIのlint、typecheck、tests、cache無効|成功、Web 140件、UI 9件|`final-web/output.log`|
|依存policyとworkspace lint|成功|`final-web/output.log`|
|repository scripts|11件成功|`final-web/output.log`|
|runnerと外部fetch遮断fixture|9件成功|`final-web/output.log`|
|公開ページ、locale、ナビ、osu!設定、退役404、editor認証|PC 1440pxとmobile 390pxで32件成功|`final-browser-isolated/results.json`|
|editorのログイン、下書き作成、lead編集、entry追加、保存、公開、再読込|成功。匿名表示からdraft entryを除外|`final-editor/result.json`、`final-editor/artifacts/results.json`|
|editorの外部GitHub書き込み防止|server fetchをfake repositoryへ限定。実ネットワークへの変更要求なし|`final-editor/artifacts/github-ledger.jsonl`|
|実osu! OAuth、profile、recent、best|すべてHTTP 200。日英browserで実レスポンスと順位・スコアを照合|`live-readonly-results.json`|
|osu!の公開Tweet|日英browserで実際の公開本文を表示、page error 0|同tar内の `live-readonly-en.png`、`live-readonly-ja.png`|
|skin-workbenchとosu-skin-coreのソース|開始時 `6e249c53` との差分なし|`git diff 6e249c53 -- product/apps/osu-skin-workbench product/packages/osu-skin-core`|
|browserの環境境界とレポート非継承|sentinelを渡した実レポートに値なし。3件成功、skipなし|`final-sentinel/result.json`、`final-sentinel/output.log`|

`.env.local` のosu!資格情報はprivateな子プロセスで読み、必要な二項目だけを渡した。秘密値とtokenは証拠へ保存していない。公開browser suiteは資格情報なし、editor suiteはダミー資格情報とserver-side fixtureを使う。実資格情報の検証は `f0065fec` 時点で行い、その後osu!のAPI実装は変更していない。

ChromiumはNixで固定した149.0.7827.53。Firefox、WebKit、実機スマホ、別hostへの移設、GitHub CIと本番deployは今回の検証範囲に含まない。既存のBiome非null assertion警告4件、Nodeのmodule形式とbuild時listenerの警告は残るが、上表のコマンドはexit 0。

途中の再実行ではGitHubのGETが403となった。後続の親環境・限定環境・実Next adapter比較はいずれも200で、過去の403をrate limitと断定できる資料は残っていない。調査は `c51-premise-evidence.md` に保存した。その後残ったmobileの `ERR_ABORTED` は、一つのtestが別URLへ移動して前の背景要求を中断したもの。各URLを独立したPlaywright testとpageで検証するよう直し、32件すべて通過した。エラーの無視条件は追加していない。

## 独立レビュー

- 最初のcorrectness/security reviewerは `84b571b5` で公開scrapの競合による下書き漏洩を再現し、統合を止めた。task `ses_e670065c5ffev76RvVaycmtyJOI`。
- 修正 `0dda91ed` は別contextのreviewerが実GitHub snapshot実装と回帰テストを確認し、PASSとした。Web 140件、型検査、fixtureを独立実行した。task `ses_e66f79a75ffevRxxg4aFfraJOI`。
- 最終差分 `0dda91ed..77b05583` はさらに独立contextでreviewし、PASS。shared所有権、schema、初回保存version、UIの購読とcleanup、runnerの環境境界を確認した。task `ses_e65fdb81bffe4RDtdzPuNuPR1P`。
- comment reviewの最終差分に未解決MUST KILLはない。task `ses_e65fdb7f9ffetN5yKB56Ph4Sct`。
- 証拠の環境分離とredactionツール `c51d8aa1` も独立レビューでPASS。runner 8件、環境2件、Python sanitizer 5件を独立実行した。実レポートを必要とする追加1件は親が最終32件のレポートで実行した。task `ses_e65e3a864ffe5bFtwGW3owfANU`。

correctness reviewerはOpenAI GPT-6.1 Sol系統の独立context。異なるモデルfamilyによるreviewとは主張しない。

## ブランチと作業ツリーの保全

初回の `preservation/manifest.json` と削除直前の `final-preservation/manifest.json` に、10作業ツリーの状態、tarとの照合成功、Git bundle、Git metadataのSHA-256を記録した。`.audit` の未commit記録、添付briefとZIP、Serenaの自動migration、ローカル設定も生成物を除いて保全した。保存用CLIは `repo-ops/renewal/preserve-worktrees.mjs`。生成物とcacheの除外は削除直前manifestの `excluded` に記録した。

必要なrenewal実装をdevelopへ統合する。旧実装の同等patchと統合済み履歴はブランチ名を残す必要がない。次の固有履歴は採用せず、外部bundleに保全する。

|履歴|判断|
|---|---|
|`ai/workbench/validation-mvp` の `c6b37bff`|未採用のasset matrix検証案。現行ソースに存在しないため、skinソースを変更しない今回の統合には入れない。tip `843b6e04` と祖先を保全|
|同branchの `282be7d9` と `4a25d485`|過去の製品仕様と退役済みCastaliaのlauncher。実行導線を復活させない|
|`feat-10y10m` の初回実装、revert、reapply|現在は後継のmodular dot-typeが存在する。古い単一pageへ戻さない|
|`feat/doc-linter-improvement` の `a20325fe`|旧 `GEMINI.md` のworkflow指示。退役した仕組みを再導入しない|

整理対象branchは外部bundleの元refから復元できる。初回bundleと削除直前の `pre-deletion.bundle` は `git bundle verify` で完全な履歴を検証した。既存stashもbundleとGit metadataに保存し、無関係な差分を今回の製品へ混ぜなかった。

元の失敗証拠 `browser-evidence-actual` と `browser-evidence-skill`、後続の修正・実API・browser証拠は `prior-browser-evidence.tar` に保存した。旧レポートに親環境の資格情報が含まれていたため、環境全体のシリアライズを廃止し、JSONから該当値を除去した。ZIPは既知の値とcredential fieldを検査した。status文字列のみを持つ実API結果は別ファイルで保持する。

修復後の証拠とtarを照合した。SHA-256は `f0ecb015f60cb3b71d9b8239d69d1fb6a439367eefb159693c3922b04a768676`。元tarと修復後tarの17レポートを比較し、`suites`、`stats`、`errors` がすべて一致した。再実行用の比較スクリプトは基準ディレクトリの `compare-evidence.mjs`。検査範囲と修復結果は `evidence-redaction-scoped` と `ui-evidence-redaction` に保存した。検出器は既知のfield名と値を使うheuristicであり、すべての形式や未知の資格情報がないと保証しない。元のtarは秘密を含み得る `raw-browser-evidence.private.tar` として0700の保全先内へ隔離した。秘密設定を含む作業ツリーbackupと同様に公開しない。

## 統合後の状態

必要な実装と検証記録を `1e85aca1` としてローカルdevelopへfast-forward統合した。2026-11-02 03:07:51 UTCの確認で、ローカルbranchはmainとdevelop、登録worktreeは元の一つ、追跡・未追跡の未処理変更はなし。不要な19branchと9 linked worktreeを整理した。結果は `consolidation.json` と基準ディレクトリの `cleanup-result.json` に記録した。本記録を確定する後続commitは製品runtimeを変更しない。

添付briefとZIP、旧goal pluginのローカル状態は基準ディレクトリの `recovered-local-files/` へ移して保持する。生成されたplugin状態とPython cacheはGit管理から除外する。compaction設定の追加は取り消し、`opencode.json` に今回の差分はない。
