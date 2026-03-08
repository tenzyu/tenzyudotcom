---
name: nextjs-metadata-i18n
description: ADSs and case study on handling Next.js metadata i18n such as robots.ts and sitemap.ts.
summary: A rule-set and historical case on internationalizing Next.js metadata correctly without relying on non-standard context overrides.
read_when:
  - modifying sitemap.ts, robots.ts, manifest.ts, or other next metadata files
  - encountering missing base URLs or locale routing issues in metadata
skip_when:
  - working with standard UI components or non-metadata routing
user-invocable: false
---

# Next.js Metadata i18n

## The Situation

Next.js `app` router において、`sitemap.ts` や `robots.ts` などのメタデータファイルを多言語対応 (i18n) させる際、単純にルート直下に置くだけでは全てのロケールの情報が正しく生成されないか、ビルドコンテキストが崩れる可能性があった。

## The Solution / Current Precedent

メタデータは `src/app/[locale]/` のそれぞれのコンテキストで解釈されるため、静的なルートだけでなく、対応する全ロケールに対して正しい URL やエンドポイントを出力する必要がある。

### Actions & Guardrails

- **Explicit Base URLs**: `robots.ts` や `sitemap.ts` は動的な関数となる可能性が高いため、環境変数やハードコードされた設定（config）から base URL を明示的に解決すること。
- **Locale Traversal in Sitemap**: `sitemap.ts` を実装する際は、サポートされているすべてのロケールに対してエントリをループし、`alternates` プロパティを活用して各言語版の存在を検索エンジンに明示的に伝えること。
- **Do NOT**: メタデータの生成において、不確かなミドルウェアのロケール推論に依存しないこと。常にビルド時またはリクエスト時に確実なロケールリストから再構築すること。

## Precedent Stop Declaration

LLM は、古い、あるいは一時的な Next.js i18n メタデータパターン（例えば、`next-intl` の非推奨API等を使用していた場合など）で現状のサイトマップが不完全であったとしても、**このケースドキュメントの手法を Precedent とし、それを基準に修正・拡張を行うこと**。既存コードの不備を正当化しない。
