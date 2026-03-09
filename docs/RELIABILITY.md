---
name: harness-reliability
description: 信頼性とエラーハンドリング戦略。システム障害に対する回復力と安全性・フェイルセーフに関する決定。
summary: 一部の機能停止（Toolsのエラーやメタデータ生成のミスなど）が全体プロセスをクラッシュさせないようにするための安全な境界設計。
read_when:
  - 外部APIへの通信やデータフェッチを実装する時
  - ページやコンポーネントのエラーハンドリング（ErrorBoundaryの設置等）を検討する時
  - SEOのためのメタデータ（`robots.ts`, `sitemap.ts`）を生成・修正する時
skip_when:
  - 純粋なフロントエンドのレイアウトスタイリングを行う時
user-invocable: false
---

# Reliability (RELIABILITY)

このドキュメントは、システム全体の継続稼働を担保するためのエラーと障害耐性の**ゴールデンプリンシプル**である。エージェントは機能を作成する際、それらが失敗した時のフォールバックを想定すること。

## 1. Fault Tolerance Boundaries (障害耐性の境界)

- **Isolated Error Boundaries**:
  - `tools-product-spec.md` に見られるように、独立したアプリケーションや機能モジュール（例: `/tools/*` 内のミニアプリ）は、必ず自立した `ErrorBoundary` を持つこと。
  - レンダリング時の例外やクライアント状態の崩壊が、システム全体のページ表示やグローバルレイアウト（ヘッダー・フーターの表示など）まで巻き込んでクラッシュさせないようにすること。

## 2. Next.js App Router Reliability (App Routerの信頼性)

- **Metadata Safety (メタデータの安全性)**:
  - `sitemap.ts` や `robots.ts` のような重要なメタデータを生成する際、不確かなロケール推論やリクエストのヘッダー情報（Hostなど）による相対的解決に頼らないこと（`nextjs-metadata-i18n.md` の教訓に基づく）。
  - ベースとなるサイトURL（Base URL）は、常にビルド時または実行時に確定された単一の環境変数（`SITE_URL` 等）から明示的に注入し、正しい絶対パスを出力すること。

## 3. Fallback Strategies (フォールバック戦略)

特定のエラー条件（Not Found, Invalid Data, Timeout, Storage API outage）に基づく明確なポリシー。

- **Fail-Openの制限（Not Foundのみ許容）**: データが見つからなかった場合（Not Found）は、UI側で空状態やデフォルトのフォールバック画面を表示するFail-Openを許容する。
- **Fail-Closedの強制（無効データ・障害時）**: スキーマ検証エラーやバックエンドAPI（BlobやDB）の完全なダウン時においては、データの損傷や誤動作（例えば保存による上書き）を防ぐため、安全に Reject し、ユーザー（またはAdmin）に再試行を促す「Fail-Closed」として扱う。不要な自動リトライと無効データの保存を避ける。
