---
name: harness-quality-score
description: コード品質とテスト要件。Clean Architectureの基準とTypeScriptの型安全性強制ルール。
summary: 「汚いコード（Dirty Code）」の発生を防ぎ、カスタムリンター仕様やクリーンな責務分割を維持することで、サイト全体の品質スコアを高く保つための規律。
read_when:
  - 既存コードのリファクタリングを行う時
  - PRや新しいモジュールがマージ可能な品質基準を満たしているかレビューする時
  - 型定義やリンター設定を変更する時
skip_when:
  - コンテンツ（Markdown記事等）のみを修正している時
user-invocable: false
---

# Quality Score (QUALITY SCORE)

このドキュメントは、コードベースの高い品質を維持し「技術的負債（Technical Debt）」を能動的に排除するための**ゴールデンプリンシプル**である。

## 1. 原則: No "Dirty Code" Policy

コード品質の維持において、「動いているから」という理由だけで肥大化した状態（Dirty Code）を放置することを許容しない。
技術的負債は小さく継続的に返済（Garbage Collection）し、新規追加コードにおいてはクリーンアーキテクチャと段階的な責務分離を強制する。

## 2. Clean Architecture と責務分割

- **巨大コンポーネントの禁止**:
  - `table-of-contents-refactoring.md` のケーススタディで示されたように、「UIの見た目」「状態管理（State）」「DOM監視（IntersectionObserverなど）」「スクロールロジック」が1つの見通しの悪いコンポーネントに混ざり合った状態を許容しない。
  - 発見次第、ロジックはカスタムフック（例: `useActiveHeadline`）に、UI部品は小さな関数コンポーネントに切り分けること。
- **Token-first Styling (インラインスタイルの撲滅)**:
  - `style={{ color: 'red', marginTop: 10 }}` のようなインラインスタイルや、ハードコードされたマジックナンバーは禁止する。一貫性のため、常にTailwindCSSの定義済みトークン（クラス）や `cva` (Class Variance Authority) を用いたクラスバリアントの定義に置き換えること。

## 3. TypeScript Error Prevention と Contract (境界と型)

- **境界でのデータ検証**:
  - 境界で受け取るデータ構造の型定義とバリデーション（`*.contract.ts` / `*.schema.ts`）を重視する。
  - 外部APIからのレスポンス、MDXのフロントマター、検索パラメータなどの入力や不明なデータ元からのJSONは、必ず境界（Boundary）で Zod などのスキーマバリデーションライブラリを通して検証し、ランタイムで安全に型を確定（正規化）させること（Parse, don't validate）。
- **`any` の原則禁止**:
  - TypeScriptの強みを殺す `any` や、不安全な `as` キャスト（Type Assertion）を用いた場当たり的な型エラーの握りつぶしは厳禁とする。
- **厳格なNull/Undefinedチェック**:
  - 存在しないかもしれないオブジェクトプロパティに対するアクセスは、オプショナルチェイニング（`?.`）や Nullish Coalescing（`??`）を用いて安全に処理し、実行時エラー（`Cannot read properties of undefined`）を根絶する。

## 4. 自動規律と Linter-First (Enforcement)

品質基準は、ドキュメントの記載だけでなくリンターや型システムによって自動で強制されることを理想とする。

- **Linter-First (リンター主導)**:
  - コード規約（ESLint, Prettier）、およびドキュメント品質（Harness EngineeringのためのFrontmatter・構造リンター）の制約を「破る」ようなPRを作成してはならない。エラーが出た場合は、リンター設定を弱めるのではなく、コード側を正しく修正すること。
  - エージェント生成コードにおいても、依存関係ルール（例: Feature同士の直接依存防止や、Site-UIへのビジネスロジック混入防止）からの逸脱を監視・修正プロセスに委ねる。
- **Doc-Gardening**:
  - コードを変更したことによって `docs/` 配下の仕様書や方針に矛盾が生じた場合は、コードの変更と同一の修正単位でドキュメントもアップデートすること。ドキュメントはコメントと同様、常にコードと同期した生きた知識ベースである。
