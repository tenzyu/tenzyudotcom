# neko7 OpenCode 調査記録

2026-11-02 の読み取り専用調査。再起動、切替、OS 適用は行っていない。

## 接続と復旧

- 現在の URL: https://neko7.tail79927f.ts.net/ 。Tailscale Serve は tailnet 限定で `127.0.0.1:4096` に転送する。Funnel の公開設定は確認されなかった。
- `opencode-neko7-persistent.service` は `tenzyu` の systemd user service。enabled、active、`Restart=on-failure`。`loginctl` の lingering は有効。実際のログアウトや OS 再起動後の復旧は未検証。
- サービス定義: `/home/tenzyu/.config/systemd/user/opencode-neko7-persistent.service`。作業ディレクトリは `/home/tenzyu/dev/tenzyudotcom`。環境ファイルの中身や認証値はこの記録に含めない。
- OpenCode v2.2.1。ログは `~/.local/share/opencode/log/opencode.log`、DB は `~/.local/share/opencode/opencode.db`。秘密を含む可能性があるためログや DB を公開しない。
- 障害時はまず `systemctl --user status opencode-neko7-persistent.service` と `tailscale serve status` を確認する。ログは秘密を含む可能性がある。再起動や Serve の変更は接続を切るため、別のアクセス手段と承認を確保してから行う。
- 無認証の `/api/info` はローカルと上記 HTTPS の両方で HTTP 401。トップページの HTTP 200 は認証済み操作の証明ではない。

## 注意事項

- `opencode service status` は別の共有サービス `127.0.0.1:49374` を指す。実行中の両サーバーが同じ DB と WAL を開いていることを `/proc` で確認した。安全性は未評価。どちらも調査中に停止しない。
- `opencode pair` は共有サービス用であり、4096 番のサーバーと同一とは限らない。`repo-ops/renewal/pair-current-server.mjs` は現在の user service の環境から認証情報を取得し、4096 番の `/api/pair` に短命のコードを要求する。非 TTY 出力を拒否するが、端末の録画や記録を防ぐものではない。リンクを生成する場合は OpenCode のログに残らない別端末で実行し、リンクをチャットや Git に貼らない。公式資料ではリンクは一度だけ有効で、5 分で期限切れになる。
- ユーザーは neko5 で同じ会話を表示できたと報告した。neko5 からの追加メッセージ送信と nekosm1 への切替後の確認は未検証。
- [OpenCode v2 Web 公式文書](https://opencode.ai/v2/docs/cli/web/) は pairing 後の session cookie の有効期間を 30 日とし、サーバーパスワード変更時は全 session がログアウトすると説明する。実際の期限切れと再ログインは未検証。
- `opencode service set` と `unset` は共有サービスを停止する。現在のセッション保護のため実行しない。
- 4096 番サービスには明示的なメモリ上限と CPU 上限がない。適切な値は未決。

## リポジトリ

- `tenzyudotcom`: `/home/tenzyu/dev/tenzyudotcom`、`develop`、調査開始時 HEAD `d63c674bec3c23b84b1fe3e789b5d36d4671205e`。既存変更は `.serena/project.yml` と未追跡の `docs/renewal/neko7-e2e-smoke.md`。両方を保持する。
- `nixfiles`: 別チェックアウト `/home/tenzyu/.nixfiles`、`main`、調査開始時 HEAD `3cf330792d31df0721289d91e5643aa5fdee8f77`。調査時 GitHub `main` と一致し、作業ツリーはクリーン。
- `/etc/nixos` は Git チェックアウトではない。実行中の system は `/nix/store/56whb8xcv2jrfrpihxh5sy7r4af0cp7b-nixos-system-neko7-26.05.20261020.cd4ea8d`。`~/.nixfiles/result` は同じ system を指すが、これだけでは全設定の一致を証明しない。
- Bun は通常 PATH にない。`nix develop --no-write-lock-file --command bun --version` は `1.3.13` を返した。リポジトリの packageManager 指定は `1.3.10`。
- `nix eval --no-write-lock-file --raw .#nixosConfigurations.neko7.config.system.build.toplevel.drvPath` は derivation path を返した。`system.stateVersion` 未設定で 26.05 に既定化する警告と Nix DB busy の警告が出た。これは system のビルド成功や OS 適用の確認ではない。評価中に Nix は依存の取得と一部の derivation のビルドを行った。
- `nix build --no-link --no-write-lock-file --max-jobs 1 --cores 2 .#nixosConfigurations.neko7.config.system.build.toplevel` は成功した。これは既存設定のビルドで、無効の OpenCode 移行候補を有効化したものではない。OS の適用は行っていない。

## 未検証と次の作業

neko5 と nekosm1 の同一セッション、ログアウト後と再起動後の復旧、外部ネットワークからの到達不能、ゲームへの影響は未検証。ダッシュボード、公開プレビュー、Storybook の管理、ブラウザ受入試験、承認付き Inbox はこの調査では実装していない。実機認証にはユーザー操作が必要。現在の URL、unit、DB、環境ファイルを保全したまま、Nix の feature と実行中の設定を比較する。

## Node プロセス増殖の調査

- `tenzyudotcom-preview.service` は既存の一時 user service。`127.0.0.1:4174` で `next dev` を実行する。Tailscale への公開は確認されていない。
- 17 時台の観測では、`next-server` の子に稼働中の PostCSS worker 42 個と zombie の Node 子プロセス 20 個があった。unit 全体の systemd メモリ使用量は約 4.4 GiB。値は観測時点のもので、原因や今後の増加速度を示すものではない。
- 同じ親の worker が複数の時刻に発生している。発生条件と根本原因は未確定。`systemctl --user status tenzyudotcom-preview.service` と `ps --ppid <next-server PID> -o stat,args` で確認できる。
- 修正と検証は未実施。既存プレビューとその利用者に影響するため、調査時に unit の停止や再起動はしていない。OpenCode unit は別である。
- 次に、競合しない一時ディレクトリとポートで、既存プロセスを触らず再現する。Next.js の dev bundler と変更監視を切り分け、worker 数と子プロセス終了を観測する。修正後は同じ手順で再測定する。
- `repo-ops/renewal/README.md` は public と editor のブラウザ試験が同じ `.next` を使うため同時実行しないよう明記している。ポートを分けるだけでは既存プレビューと安全に併走できない。これが今回の増殖の原因かどうかは未検証。
- `/tmp/opencode/neko7-worker-test/run.dpmDOBzG` の Git archive を使った分離試験は不成立。最初は Python 不在で起動前に終了した。修正後は Turbopack がコピー外を指す `node_modules` シンボリックリンクを拒否して終了した。既存プレビューは変更していない。依存関係も分離コピーに置くなどして再試験する必要がある。
- 調べた 2 つの PostCSS worker は親 `next-server` と TCP 接続を維持していた。worker の生成条件と終了・回収が行われない原因は未確定。約 30 秒間隔で起動した時期はあるが、現在も増加しているとは確認していない。コードによる修正は未実施。
- ユーザーが増殖の解決を依頼したため、調査継続中に `systemctl --user stop tenzyudotcom-preview.service` でプレビューだけを停止した。OpenCode は停止していない。原因と安全な起動方法が確認されるまで、このプレビューを再開しない。

## 静的 Storybook

- 既存の Storybook 10.4.0 を使い、`/tmp/opencode/neko7-storybook-build-20261102` に静的ビルドした。`index.html` と `index.json` の存在を確認した。出力は一時ファイルであり、再起動後の永続性は保証されない。
- 最初の起動は CLI のパスが誤っていたため失敗し、実際の `node_modules/.bin/storybook` のリンク先を確認して一度修正した。ビルド後に Storybook の dev または build プロセスは残っていない。
- 一時的な loopback 専用 HTTP サーバーで静的出力を配信し、Chromium で Accordion の story を開いた。HTTP 200、タイトル、page error なしを確認した。画像と trace は `/tmp/opencode/neko7-storybook-evidence-HUlnV8` にある。画像では Accordion の内容と Storybook のナビゲーションを確認できる。試験後に HTTP サーバーは終了した。
- Tailscale からの到達、自動再ビルド、コンテンツの更新検出は未検証。出力フォルダのクリーン操作を伴うため、再ビルド前に出力先が専用の作業領域であることを確認する。
- 生成物を `/home/tenzyu/.local/share/neko7-previews/storybook.pw731Rv7` に保存した。Agent からの追加は sudo の認証が必要で失敗したため、ユーザーが `sudo tailscale serve --bg --https=8443 ...` を実行した。現在の URL は https://neko7.tail79927f.ts.net:8443/ で、Serve は tailnet 限定と表示する。neko7 の Chromium で 390px 幅の Accordion story、HTTP 200、page error なしを確認した。neko5 と nekosm1 実機は未検証。停止にはユーザーの管理権限で `sudo tailscale serve --https=8443 off` を使い、既存の 443 を `tailscale serve status` で確認する。

## ブラウザ試験の中断

- 実行中の `127.0.0.1:4174/en/portfolio` を Chromium で開き、HTTP 200、`html[lang]=en`、1440px 幅で横幅超過なしを確認した。これは言語切替や画面の視覚確認の証明ではない。
- スクリーンショットの取得が `Page.captureScreenshot: Unable to capture screenshot` で失敗した。全ページ撮影を viewport 撮影へ変更して一度再試行したが同じエラーで失敗した。指示された自律修正回数の上限に達したため、この試験を繰り返さない。
- osu、モバイル表示、console、network、trace、before/after 画像の確認は未完了。スクリーンショットの失敗原因も未確定。
- 公開サイト `https://tenzyu.com/en/portfolio` は 1440px と 390px で HTTP 200。390px の文書幅は 454px で、はみ出しは footer のボタン列にあった。公開サイトの `/en/osu` は 404。このサイトは Vercel のプレビューと確認できておらず、本番への変更も行っていない。公開サイトの画像は `/tmp/opencode/neko7-public-baseline-XFNqTS` にある。現在のソースの footer は既に `flex-wrap` を指定しており、公開サイトと同じ欠陥がローカルに残るか未確認。
- 言語セレクタは別の DOM 操作試験で検証した。修正前は英語ページで日本語を選んでも URL と `html[lang]` は英語のままだった。Base UI の menu item の `onSelect` を `onClick` に変更した後、`/en/portfolio` から `/portfolio` に移動し、再読み込み後も `html[lang]=ja` だった。表示文言、キーボード、モバイル、画像の検証は残る。
- 隔離コピーの PC と 390px 幅で portfolio と osu の HTTP 200 と言語切替を確認した。日本語 osu の目次が英語固定だったため、見出しと navigation 名を翻訳辞書から渡すよう修正した。隔離コピーで日英の表示とアクセシブル名を確認し、日本語画像を https://neko7.tail79927f.ts.net:8443/evidence/osu-toc-ja.png に置いた。隔離コピーは webpack とテスト専用設定を使用したため、現行の標準 dev 設定の証明ではない。
- `bun --no-env-file nx run web:verify:quick` は Nx から起動された shell が `bun` を見つけられず失敗した。`NX_DAEMON=false` でも同じエラーだった。ユーザーはその後、自律修正の回数制限を撤回した。
- 後の調査で実リポジトリ上の Nx が dotenv ファイルを開いた。値の表示・参照はしていないが、`.env` を読まないという制約に違反した。以後の再現は dotenv のない隔離フィクスチャで行う。
- 隔離フィクスチャでは Nx 経由の Bun 子スクリプトで PATH から Bun が見えなくなり、対象 workspace の `bunfig.toml` で `[run] shell = "bun"` とすると成功した。これは web の全 Bun scripts のシェルを変更するため、互換性検証が必要。実リポジトリ全体の `verify:quick` 成功の証拠ではない。
- dotenv を含まない別のソースコピーで `bunfig.toml` を使った `web:verify:quick` は lint を通過したが、型検査で 45 件の implicit-any エラーが出た。隔離試験で、このエラーは Storybook build が UI の共有 `dist` の型宣言を誤った相対 import で上書きすることで再現した。
- `product/packages/ui/vite.config.mts` を変更し、Storybook build では型宣言を生成しないようにした。ユーザーの承認後、上書き済みの `dist` を `/tmp/opencode/ui-dist-before-repair.BJM7qaEd/dist` に保全し、通常の UI build で再生成した。`input.d.ts` は `react` を参照する形に戻った。
- dotenv のない隔離コピーに今回の web ソース変更を反映し、`web:verify:quick` が lint、型検査、140 テストを通過した。lint は既存の non-null assertion 警告を 4 件出した。Storybook からの副作用防止の回帰試験は進行中。

## 外側ループの試作

- `repo-ops/renewal/candidate-state.mjs` はローカルの状態遷移モデルで、実行器や自動再開を持たない。提案文はデータとして保存し、明示的な承認記録なしの開始を拒否する。
- `nix develop --no-write-lock-file --command node --test repo-ops/renewal/candidate-state.test.mjs` は 4 件成功した。レート制限と復旧は模擬であり、実 API の解除確認ではない。
- このモデルの承認と再開証拠は自己申告であり、認証・実行の重複防止・クラッシュ後の exactly-once を保証しない。実タスクを自動投入しない。
- `repo-ops/renewal/candidate-state-cli.mjs` は私有ディレクトリ内の提案、閲覧、手動承認だけを扱う。状態モデルと CLI の模擬試験は合計 6 件成功した。使い方とローカル利用の制約は `repo-ops/renewal/candidate-state-cli.md` にある。
- OpenCode v2 の公式 API にはセッション Inbox、durable session log、`session.retry.scheduled` イベントがある。公式クライアントのイベント購読は live-only で再生・自動再接続をしない。再接続時の永続状態の再読込が必要。実 API に基づく再開機構は未実装。

## Nix 移行候補

- 別リポジトリの `~/.nixfiles/modules/50-features/opencode-neko7-service.nix` は無効なレビュー用候補。既存 user unit と同じ名前とポートを定義するため、そのまま有効化・適用しない。
- 候補は現行 2.2.1 と同じ Nix store バイナリを専用 input で固定する。feature を一時的に有効化した neko7 全体構成の `nix build --no-link` は成功した。切替とロールバックの手順は `~/.nixfiles/docs/opencode-neko7-migration.md`。既存の環境ファイルへの依存、資源上限の検証、OS 適用、切替前後のセッション保全は未実証。

## 管理権限の扱い

- `sudo` は PATH 上の `/run/current-system/sw/bin/sudo` が setuid されておらず、実行できなかった。`/run/wrappers/bin/sudo` は実行可能だがパスワードを要求した。Agent はパスワードを取得しなかった。
- 頻繁な操作に wheel 全体の `NOPASSWD: ALL` を付けると、Agent に OS 全体の権限を渡す。代わりに、必要な unit と操作だけを受け付ける root 所有の固定コマンド、限定 sudo rule または限定 polkit policy、監査ログを検討する。ユーザーが変更内容と取り消し手順を承認するまでは適用しない。
- `tailscale set --operator=tenzyu` は特定の Storybook 操作だけではなく Tailscale daemon の操作を許すため、必要な権限範囲を確認しないまま設定しない。
