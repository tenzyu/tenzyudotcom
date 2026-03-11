---
name: session-auth-hardening
description: 進行中のタスク：現行の最小限のセッション認証を高度化するための強化タスク。
summary: Passkey、OAuth Provider、Audit Log 等の本格的なセキュリティ認可機能の不足を補う。
read_when:
  - 複数人編集の権限や高度な認証プロバイダー（Auth.js等）を統合する時
skip_when:
  - 既存のUIコンポーネントのみを改修している時
user-invocable: false
---

# Session Auth Hardening (Follow-up)

現在のセッション認証は「自己専用のもの（self-only minimal auth）」として構築されており、以下の機能が未対応である。

- Passkey（WebAuthn）によるパスワードレスログイン
- 外部プロバイダー（Google/GitHub等）によるOAuth
- 操作履歴の記録（Audit log）

将来的に複数人での編集環境が必要になったり、セキュリティ要件が上がった場合にはこれらの導入を検討し、認証モデルを作り直す必要がある。
