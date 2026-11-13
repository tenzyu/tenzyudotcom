# neko7 ダッシュボード: 安全境界の調査

2026-11-02 の調査。ダッシュボードは未実装、未起動。既存の OpenCode、Tailscale Serve、systemd unit は変更していない。

## 確認できたこと

- `tailscale serve status` は tailnet 限定の HTTPS 443 で `/` を `127.0.0.1:4096` に転送していた。既存のルートを置き換えずに、この URL の配下にダッシュボードを追加できるとは確認していない。
- `docker info --format '{{.ServerVersion}}'` は Docker socket が存在せず失敗した。Docker CLI の存在はコンテナを実行できる証拠ではない。
- `systemctl --user is-system-running` は `degraded` を返した。原因は未調査であり、ダッシュボードとの因果関係は不明。
- [Homepage の公式インストール文書](https://gethomepage.dev/installation/) によると、v2 の認証はパスワードまたは OIDC を使う。OIDC の場合は認可をプロバイダー側で設定する必要がある。既存 OpenCode の認証を Homepage で利用できるとは確認していない。
- [Tailscale Serve の文書](https://tailscale.com/docs/features/tailscale-serve#identity-headers) はプロキシ先への identity header を説明しているが、localhost の別プロセスによる偽装リスクも明記している。header の存在だけを認証の証明にしない。

## 保留と再開条件

新しい独立パスワードの作成は許可されていない。既存 OIDC の有無、利用可能な認証連携、利用者の許可範囲は未確認。認証なしの画面や状態変更 API は公開せず、既製品のダッシュボードも起動しなかった。loopback でのダッシュボード動作確認も未実施。

再開時は、まず既存認証との安全な連携または利用者が管理する OIDC を確認する。別ポートでの tailnet 公開が必要なら、443 を保持した構成を別途レビューし、Serve 設定変更の承認を得る。状態変更を追加する場合は、認証、認可 allowlist、CSRF 対策とその拒否試験を先に完成させる。systemd 制御や Docker socket の公開は行わない。
