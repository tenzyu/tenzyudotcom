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

## 1. Secrets and Environment Variables (シークレットと環境変数)

- **ブラウザへの露出厳禁**:
  - 接頭辞 `NEXT_PUBLIC_` が付いていない環境変数（DBパスワード、APIキー、Blobのトークンなど）を、Client Components で解釈しようとしてはならない。
- **一元化された環境変数のバリデーション**:
  - `process.env` を複数ファイルから直接参照する（散在させる）のは禁止である。
  - すべての環境変数は、型安全なスキーマ（例: `zod`）を用いて特定のバリデーションファイル（例: `env.mjs` 等）で中心的に検証し、パースされた安全なオブジェクトを通してのみアプリケーション全体にアクセス可能とすること。

## 2. Boundary Defense (境界の防御)

外部からの入力（Queryパラメータ、Pathパラメータ、POSTのBody）を受け付ける Server Actions または Route Handlers は、「ゼロトラスト」を前提とする。

- **入出力のスキーマ検証**:
  - 関数やAPIの入り口で、外部入力（FormData、JSON等）は必ず Zod `schema.parse()` または `schema.safeParse()` を通過させる。「クライアント側でバリデーションされている」という前提には一切依存しない。
- **Server Actions の慎重な使用**:
  - `use server` ディレクティブを利用する Action 関数は、グローバルに公開されたエンドポイント（POST）と同義であると認識すること。その処理が認証（Self-only admin 等の認可）を要求する場合は、処理の最上部で厳格に権限チェックを行う。

## 3. Storage and APIs (ストレージとAPI層)

- 認証などの責務は、UIレンダリングのツリー（Server Components内）と深く結合させるのではなく、ミドルウェア（Middleware）またはデータアクセス層の一番手前（Guard）で行い、不正アクセスを最速で遮断すること。
