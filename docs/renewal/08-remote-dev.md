# neko7 への移行条件

neko7 への接続・設定変更は今回実施していない。neko5 にtailscale commandがあることだけ確認した。neko7 のVM、ユーザー、容量、ACL、ブラウザUI、実機からの到達性は未検証。

## 提案する分離

- コード、build、agent、testsはneko7上の非特権開発ユーザーに置く。
- Web専用Nix shellを基本にし、Tauri環境を必要な作業に限定する。
- previewはloopbackにbindし、Tailscale等の認証付き経路でのみ利用する。
- agentへroot、sudo、Proxmox管理、本番書込資格情報を渡さない。
- browser feedbackは要素・画面・URL・説明の記録に限定し、任意shell commandへ変換しない。

## 移行時の合格順序

1. バックアップとGit refs、未コミット差分、content repoを別の場所へ復元する。
2. Webの依存install、生成型、tests、buildを読み取り専用データで実行する。
3. PCと390pxのbrowser testsを実行し、画像を保存する。
4. neko5、nekosm1、スマホから認証付きpreviewとagent UIへ接続する。
5. 本人の操作確認後に切替を承認する。

ロールバックはneko5の保全済み作業環境への復帰。切替確認前にneko5の環境や秘密設定を廃棄しない。具体的な接続先・認証方式はneko7環境の調査後に決める。
