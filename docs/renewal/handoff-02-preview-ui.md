# セッション2 引き継ぎ

## 状態

未完了。Node 増殖の原因は未特定で、隔離プレビューの試作は実用に使えない。遠隔プレビューとダッシュボードは公開していない。UI 修正の追加と今回のブラウザ検証は未実施。

既存の OpenCode は https://neko7.tail79927f.ts.net/、静的 Storybook は https://neko7.tail79927f.ts.net:8443/ にある。今回 `tailscale serve status` で両方が tailnet 限定と確認した。neko5 と nekosm1 からの実機確認は今回行っていない。既存の evidence は https://neko7.tail79927f.ts.net:8443/evidence/osu-toc-ja.png にあるが、今回アクセスを検証していない。

## 隔離プレビューの試行

2026-11-02 に `repo-ops/renewal/isolated-preview.sh` の未追跡の試作を `nix develop --no-write-lock-file --command bash repo-ops/renewal/isolated-preview.sh start` で起動した。スナップショットは `/tmp/opencode/renewal-isolated-preview.afji5nUd` にある。Git HEAD の内容を使うため、未コミットの UI 修正は含まない。元の `.next` と dotenv はコピーしていない。

systemd の設定は `MemoryMax=3G`、`MemorySwapMax=0`、`CPUQuota=200%`、`TasksMax=128`、`RuntimeMaxSec=20min`、`KillMode=control-group`。起動後の一時点で cgroup メモリは 423006208 bytes、タスクは 119 だった。タスク数はプロセス数ではなくスレッドも含む。Next は 422ms で ready を報告したが、`GET /` は 31.59 秒後に HTTP 500 を返した。journal は `Cannot find module 'critters'` を記録した。タスク制限との因果関係は未確認。

負荷を抑えるため `systemctl --user stop renewal-isolated-preview.service` で停止した。停止後は unit が inactive で、スナップショットのパスを引数に含むプロセスは `ps` で見つからなかった。これは全子孫の PID を追跡した証明ではない。journal の停止記録はメモリピーク 925.9M と CPU 時間 21.075 秒を示した。旧 `tenzyudotcom-preview.service` も inactive と確認した。

ログは `journalctl --user -u renewal-isolated-preview.service` で確認できる。ログにはパスなどが含まれるため公開前に確認する。試作の再起動や公開は、依存解決、タスク数、プロセス親子関係、制限動作、書き込み拒否を検証するまで行わない。停止操作は `systemctl --user stop renewal-isolated-preview.service`。既存の 443 や 8443 の設定変更は不要だった。

## 未完了の作業

- 隔離コピーの依存関係と HTTP 500 を調査し、実 Next でリクエスト、PostCSS 数、RSS、cgroup、親子関係、重複起動、時間制限、停止後の全子孫を検証する。今回の試行は旧増殖の再現ではない。
- 認証、CSRF 対策、操作の明示的 allowlist、拒否試験を整えてからダッシュボード制御を検討する。プレビューは書き込み操作と秘密情報の隔離を証明するまで遠隔公開しない。
- Storybook の更新手順と evidence の共有方法を検証する。
- PC と 390px で言語切替の往復と保持、osu CSS、portfolio のはみ出しをブラウザで検証する。画像、DOM、console、network、trace、before と after を残す。

今回追加したファイルはこの引き継ぎだけ。既存の未コミット変更と未追跡ファイルは保持した。コミットは作成していない。このファイルの削除で今回のリポジトリ変更を戻せる。一時スナップショットと systemd journal は残している。
