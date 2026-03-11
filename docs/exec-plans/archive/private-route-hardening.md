---
name: private-route-hardening
description: 進行中のタスク：/editorial/* などのプライベートルートに対するセキュリティ強化の実装。
summary: HeaderやMiddlewareレベルでの認可・アクセス制限の層を追加する方針。
read_when:
  - 認証ミドルウェア（middleware.ts）などにアクセス制限を追加・再構成する時
skip_when:
  - ユーザー向けの公開コンテンツにのみ影響する変更を行う時
user-invocable: false
---

# Private Route Hardening (Follow-up)

現在、プライベートルート（管理画面など）は `/editorial/*` へ移管されており、検索エンジンにインジェストされないよう `noindex` に設定されているが、それだけでは防護として不十分・脆弱である。
必要に応じて、リクエストのHeader情報、または `middleware.ts` の最前線（Front-door Constraint）でのより確実なHardening（堅牢化・認可ルール）を足す。
