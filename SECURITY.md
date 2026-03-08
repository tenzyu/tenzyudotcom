# SECURITY

## 1. External & Outbound Boundary (外部通信とAPI保護)

外部のサービスや外部からの入力を伴うリクエスト境界は、明確に保護および検証されなければなりません。

- **Server Actions & Route Handlers**:
  - `route.ts` や Server Actions （Mutation）は、明確な必要性（Webhookの受信口、署名付きコールバック、限定的な管理操作など）が発生した段階でのみ追加し、デフォルトでは保留（常設しない）扱いです。
  - 公開されたエンドポイントを通して環境変数やセンシティブなデータ（APIキー、トークン）が漏洩しないよう、処理の入り口（Contract）で `Zod` などによる厳格なバリデーションを実行し、未知の「YOLO的な（場当たり的な）」データの受け入れを禁止します。

## 2. Environment Variables & Parsing (環境変数)

環境変数は、型安全な方法で解析・管理されなければなりません。

- **Env Parsing Rules**: 環境変数は構成層（`src/config/` またはルートなど）で単一のソースオントゥルースとしてパース・検証(`env.contract.ts` などに準ずる方法)され、各コンポーネント内で直接 `process.env` にアクセスして解釈する実装を禁止します。

## 3. Storage and Permissions (ストレージと権限)

- **Sanctioned Exposing**: 現在の運用モデルにおいて、CMSやBlob、DBに昇格しうるデータ（`*.source.ts`）はセキュアに管理し、不要な管理権限ルートや閲覧ルートを作成しないようにします。
- 必要に応じて、管理・運用に特化した権限（Role・Limit）の分離が求められたときは、そのポリシーの決定とコードは `src/config/` 内で厳重に行い、散在する機能内にアドホックに実装しないでください。
