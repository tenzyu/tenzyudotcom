---
name: harness-security
description: セキュリティポリシーと環境変数の制御ルール。外部へのデータ露出と権限境界、データ保護の基準。
summary: フロントエンド（ブラウザ）への機密情報の漏洩を防ぐための強固な環境変数管理と、Server Actions / APIアクセス時の境界防御の原則。
read_when:
  - 外部のSaaS APIを使用する、またはシークレットキーを追加する時
  - ユーザー入力やリクエストパラメータを受け付けるエンドポイントを作成する時
  - Server Actions または Route Handlers を新規作成する時
skip_when:
  - スタティックなUIコンポーネントを設計している時
user-invocable: false
---

# Security Policies (SECURITY)

このドキュメントは、サイトおよび外部リソースを保護するための**ゴールデンプリンシプル**である。エージェントは、セキュリティ上の脆弱性（特に情報漏洩や不正アクセス）に繋がり得るコードを生成してはならない。

## 1. Secrets and Environment Variables (環境変数とパース)

環境変数は、型安全な方法で解析・管理されなければならない。

- **ブラウザへの露出厳禁**:
  - 接頭辞 `NEXT_PUBLIC_` が付いていない環境変数（DBパスワード、APIキー、Blobのトークンなど）を、Client Components で解釈しようとしてはならない。
- **Env Parsing Rules (一元化された環境変数のバリデーション)**:
  - `process.env` を複数ファイルから直接参照する（散在させる）実装は禁止である。
  - 環境変数は構成層（`src/config/` またはルートなど）で単一のソースオントゥルースとしてパース・検証(`env.contract.ts` などに準ずる方法)され、すべての環境変数は、型安全なスキーマ（例: `zod`）を用いて中心的に検証し、パースされた安全なオブジェクトを通してのみアプリケーション全体にアクセス可能とすること。

## 2. External & Outbound Boundary (外部通信と境界防御)

外部からの入力（Queryパラメータ、Pathパラメータ、POSTのBody）を受け付けるサービス、Server Actions、または Route Handlers は、「ゼロトラスト」を前提とし、明確に保護および検証されなければならない。

- **入出力のスキーマ検証**:
  - 関数やAPIの入り口 (Contract) で、外部入力（FormData、JSON等）は必ず `Zod` `schema.parse()` または `schema.safeParse()` を通過させ、未知の「YOLO的な（場当たり的な）」データの受け入れを禁止する。「クライアント側でバリデーションされている」という前提には一切依存しない。
- **Server Actions & Route Handlers の慎重な使用**:
  - `route.ts` や `use server` ディレクティブを利用する Action 関数（Mutation）は、グローバルに公開されたエンドポイント（POST）と同義であり、明確な必要性（Webhookの受信口、署名付きコールバック、限定的な管理操作など）が発生した段階でのみ追加し、デフォルトでは保留（常設しない）扱いとする。
  - 処理が認証（Self-only admin 等の認可）を要求する場合は、処理の最上部で厳格に権限チェックを行う。

## 3. Storage and Permissions (ストレージと権限)

- **Storage and APIs (API層での防御)**:
  - 認証などの責務は、UIレンダリングのツリー（Server Components内）と深く結合させるのではなく、ミドルウェア（Middleware）またはデータアクセス層の一番手前（Guard）で行い、不正アクセスを最速で遮断する。
- **Sanctioned Exposing (限定的公開)**:
  - 現在の運用モデルにおいて、CMSやBlob、DBに昇格しうるデータ（`*.source.ts`）はセキュアに管理し、不要な管理権限ルートや閲覧ルートを作成しないようにする。
  - 必要に応じて、管理・運用に特化した権限（Role・Limit）の分離が求められたときは、そのポリシーの決定とコードは `src/config/` 内で厳重に行い、散在する機能内にアドホックに実装しない。
