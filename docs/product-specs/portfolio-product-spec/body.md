# Portfolio Product Spec

## 1. Feature Role & Scope

`/portfolio` ページは、過去のプロジェクト、実績、および関与した作品を展示するためのハブである。
ブログとは異なり、長期的な業績を視覚的に効果的に伝えることが目的である。

## 2. Structural & Presentation Rules

- **Visual Emphasis**: 成果物は、可能であれば画像、デモリンク、またはソースコードリンクを伴い、視覚的にアピールできるように構成すること。
- **Categorization**: プロジェクトの性質（例: Webアプリ、ライブラリ、デザイン）や関与度合いに応じて情報構造を整理すること。
- **Information Architecture**: 技術スタック、期間、役割などの情報を統一フォーマットで提供し、比較可能で読みやすいレイアウトを構築する。

## 3. Implementation Guardrails (LLMs)

- **Do NOT** clutter the presentation with too much text; rely on links to detailed blog posts (`/blog` or `/archives`) if extensive explanations are needed.
- **Do NOT** load oversized assets synchronously. Ensure all images are heavily optimized and use Next.js `Image` components properly for standard performance.
