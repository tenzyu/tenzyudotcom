---
name: links-redirect-confirmation
description: 進行中のタスク：/links/[shortUrl] のリダイレクトの動作検証タスク。
summary: 新規shortUrl追加後に本番環境で実際にリダイレクトが機能するかの確認。
read_when:
  - 短縮URL（/links 配下）のリダイレクトテストを行う時
skip_when:
  - リンクの内容そのものやコンポーネントを変更している時
user-invocable: false
---

# Links Redirect Confirmation (Follow-up)

`links/[shortUrl]` のリダイレクト用ルートは、新規のshortUrl追加（admin側からの追加など）に動的に追従できるよう調整済みである。
しかし、本番環境（production）において、adminで更新したあとにRouteが正確に再生成され、リダイレクト先が正しく機能するかの確認（Validation）が必要な状態にある。
