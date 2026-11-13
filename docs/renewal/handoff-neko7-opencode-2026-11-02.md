# neko7 OpenCode 引き継ぎ

2026-11-02 の中断時点。ミッションは未完了。OS 適用、本番反映、秘密の移動はしていない。

## 現在使えるもの

- OpenCode: https://neko7.tail79927f.ts.net/ 。`opencode-neko7-persistent.service` は `tenzyu` の user service として active。既存の 443 は `127.0.0.1:4096` に転送する。別の共有 OpenCode service が `127.0.0.1:49374` で動き、両者が同一 DB を開いている。どちらも停止せず、単一 writer への移行には承認を要する。
- neko5 で同じ会話が見えたとユーザーが報告した。neko5 からの追加送信と nekosm1 への切替後の確認は未検証。接続には `nix develop --no-write-lock-file --command node repo-ops/renewal/pair-current-server.mjs` を別の記録されない端末で実行する。リンクをログや会話に貼らない。
- 静的 Storybook: https://neko7.tail79927f.ts.net:8443/ 。ユーザーが承認して Serve を設定した。生成物は `/home/tenzyu/.local/share/neko7-previews/storybook.pw731Rv7`。neko7 で HTTP と Chromium を確認済み、他端末は未検証。停止はユーザーが `sudo tailscale serve --https=8443 off` を実行し、443 を `tailscale serve status` で確認する。
- 旧 Next プレビューは Node 増殖を止めるため停止した。Tailscale 向けの web プレビューとダッシュボードは未完成。再起動や公開を急がない。

## 完了した変更と試験

- `6afb4da` は言語セレクタ、osu 目次の翻訳、Storybook が UI 型宣言を上書きする問題、Bun shell 設定と回帰試験を含む。隔離コピーの `web:verify:quick` は 140 テスト成功、lint 警告 4 件。Storybook 型宣言回帰試験は 63 宣言を確認して成功。PC と 390px の隔離ブラウザ試験は webpack と専用設定であり、標準 dev 設定の検証ではない。
- Storybook build が既存 UI `dist` を破損したため、ユーザーの承認を得て変更後 `dist` を `/tmp/opencode/ui-dist-before-repair.BJM7qaEd/dist` に保全し、通常 UI build で再生成した。保全したものは破損前の原本ではない。
- `repo-ops/renewal/candidate-state*` はローカルの Inbox 試作。6 件の模擬試験が成功したが、承認の認証、実 Agent 実行、実 rate limit の解除確認、安全な自動再開はない。実運用の自動実行に接続しない。
- nixfiles の無効な `opencode-neko7-service` 候補は現行と同じ 2.2.1 を固定する。一時的に有効化した neko7 全体構成の `nix build --no-link` が成功した。現行 unit は未変更。移行前に `~/.nixfiles/docs/opencode-neko7-migration.md` を読み、データ整合性、バックアップ、単一 writer、適用と切り戻しの承認を得る。

## 続きの優先順位

1. Node 増殖の原因を隔離試験で確定する。Next 16.2 の Turbopack PostCSS と永続キャッシュに類似報告があるが、この VM での因果関係は未証明。実 `.next` キャッシュには秘密が含まれる可能性があるため、読取、コピー、移動、削除をしない。隔離環境で生成したキャッシュのみ使う。試作は下記 stash にあるが、HTTP 500 と安全性未検証のため使用しない。
2. OpenCode の保護を維持し、実際のプレビューに対する資源上限、時間制限、停止後の子プロセス回収と書込境界を検証する。既存の同名 unit と DB を同時に起動しない。
3. ダッシュボードの認証と CSRF、固定 allowlist を設計し、既存 443 を変更せず実証する。詳細は `neko7-dashboard-boundary-2026-11-02.md`。
4. osu CSS の隔離とレイアウト、portfolio の PC・スマホの before/after、console、network、trace を検証する。公開 `tenzyu.com` の portfolio は 390px で横幅超過があったが、公開版と現ソースは異なり、`/en/osu` は公開版では 404。Vercel preview と同一と仮定しない。
5. Inbox は公式 durable session log、pending permission、retry を調査し、認証済み承認、再開可能性、排他と課金上限を実証するまで実行しない。実 rate limit は模擬しかしていない。
6. backup の保存先と許容損失時間、秘密管理、OS 適用と実機再起動をユーザーと決める。`nixos-rebuild switch` や実行中 OpenCode の停止は未承認。

## 保全と注意

- 作業開始前の `.serena/project.yml` と `docs/renewal/neko7-e2e-smoke.md` は、clean 状態のため `a0c6959d435a007538b10b44d824fa5655ad6029` の Git stash に保持した。復元は `git stash apply --index <該当stash>`。既存変更との競合を確認してから適用し、stash を自動削除しない。
- 未検証の `isolated-preview*` 試作は `3bb3f43d59a1e2aee1b4e83c69121d600b634ee6` の Git stash に保持した。`docs/renewal/handoff-02-preview-ui.md` に別セッションの試験結果がある。試作を復元・実行する前に内容と競合を確認する。
- `/tmp/opencode/neko7-mission-decisions.tsv` はローカル判断記録。`/tmp/opencode` の画像、trace、ログは秘密やローカル情報を含み得るため公開前に確認する。
- 調査中、Nx が実リポジトリの dotenv を開いた。値は表示・参照していないが、読取禁止の指示に違反した。以後は dotenv のない隔離コピーで検証する。
- プロジェクトコマンドは `nix develop --no-write-lock-file --command` を使う。OpenCode の systemd 環境は開発シェルではない。Tailscale や OS の管理操作に無制限の sudo を与えない。権限追加は対象を固定し、影響と取り消し手順を示して承認を取る。
- 制限到達で複数の background agent が中断した。最新の隔離キャッシュ調査と独立 Nix review は完了報告がなく、成功扱いしない。
