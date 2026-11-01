# tenzyudotcom renewal — Phase 0 / 1

観測日: 2026-10-29。依頼の正本: 添付 `ASTRA_BRIEF.md`。ZIP 内の同名文書も確認した。

## 現在の到達点

**再建に着手した。移行・再建全体は未完了。** neko5 の現物を保存し、秘密の設定を除いたコピーで既存挙動を再現した。既存ソース、公開ページ、lockfile、remote は変更していない。

- 元作業場所: `/home/tenzyu/Projects/tenzyudotcom`、`develop`。
- 観測時 HEAD / GitHub develop: `6e249c5358a3a3ee2880192fdb557e1ebd8c7b53`。`git ls-remote` で照合した。GitHub CI は gh 未認証のため照会できなかった。
- 作業ブランチ: `renewal/phase01-20261029`。隣接 worktree `tenzyudotcom-renewal-phase01` に検証ツールとこの記録を追加した。
- 元の未コミット変更は17 tracked paths。scraps 一式、共有 MDX、コンテンツタグのテスト、添付が未追跡。原本の変更を新ブランチに取り込んでいない。
- ブランチ12本（作業開始前）、stash 1件、タグなし、remote 2件。submodule 登録なし。git-lfs コマンドなし。LFS オブジェクトの完全性は未検証。
- 別 repo `../tenzyudotcom-content` も保全。ローカル main は追跡 ref に対し1 commit behind。最新 remote のコンテンツは未取得。
- 所在一覧は2002 entries（pruned directoryを含む）、route実体22（page20、API2）、test file77、画像等27、秘密設定の所在3。これは機械的な所在集計。全fileの価値・出典・権利が評価済みという意味ではない。
- Git 外の tar を別ディレクトリに復元し、内容・mode を照合した。復元先の group は異なる。詳細・ハッシュ・復元手順は Vault の `11-local-evidence.md` に置く。

## 検証結果の要点

|対象|結果|証拠 ID|
|---|---|---|
|frozen install / scripts 無効|成功、lockfile 更新なし|install|
|Nix web shell|起動成功|nix-web|
|Nx project graph|16 projects を検出|nx-projects / nx-graph|
|Nx 経由の Web test / lint / build|失敗。子 shell で bun / tsc が見つからない|web-test / web-lint / web-build|
|直接 Web test|104 pass、0 fail、18 files|web-test-direct|
|直接 Web lint|成功、Biome 警告4件|web-lint-direct|
|UI build|成功|ui-build-direct|
|Web typecheck|準備前は依存生成物不足で失敗。UI と Intlayer 生成後は成功|web-typecheck / web-typecheck-after-build|
|Web build|コンパイル・型検査は通過。page data 収集時に GitHub storage 設定不足で失敗|web-build-direct|
|osu-skin-core|9 pass、0 fail|skin-core-test|
|HTML exporter|構文検査・23テスト成功|exporter-test|
|Chromium PC / 390px|起動・画像・trace 取得。導線検証は失敗|browser-final-run|
|新規検証ツール|7テスト成功。子process終了・復元欠落も検証|harness-tests|

`verification-final.json` は24実行のコマンド・時刻・終了値・ログハッシュの索引。うち初期22実行は独立reviewで原本のログSHAを照合済み。ログ原本は Git 外に保存。これらは単発の再現結果であり、性能比較のベンチマークではない。

## 記録の所在

このディレクトリは移植可能な版管理用スナップショット。確認した open Vault `/home/tenzyu/Documents/obsidian/main2` の `Projects/tenzyudotcom-renewal/` に同内容を保存する。private な保全記録・画像・trace は Vault 側と Git 外の証拠ディレクトリで管理する。

次の判断は [02-decisions.md](02-decisions.md)。構成案は [03-architecture.md](03-architecture.md)。未検証は [09-acceptance.md](09-acceptance.md)。
