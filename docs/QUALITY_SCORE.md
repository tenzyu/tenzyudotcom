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

## 1. No "Dirty Code" Policy (汚いコードの禁止)

- **責務の単一性 (Single Responsibility)**:
  - `table-of-contents-refactoring.md` のケーススタディで示されたように、「UIの見た目」「スクロールやIntersectionObserverのロジック」「複雑な状態管理」が1つの見通しの悪いコンポーネントに混ざり合った状態を許容しない。
  - 発見次第、ロジックはカスタムフックに、UI部品は小さな関数コンポーネントに切り分けること。
- **インラインスタイルの撲滅**:
  - `style={{ color: 'red', marginTop: 10 }}` のようなインラインスタイルは禁止する。Tailwind CSS のユーティリティクラス（`text-red-500 mt-2`等）または `cva` (Class Variance Authority) を用いたクラスバリアントの定義に置き換えること。

## 2. TypeScript Error Prevention (型安全性の強制)

- **`any` の原則禁止**:
  - TypeScriptの強みを殺す `any` や、不安全な `as` キャスト（Type Assertion）を用いた場当たり的な型エラーの握りつぶしは厳禁とする。
  - 外部APIや不明なデータ元からのJSONレスポンスは、Zodのようなスキーマバリデーションライブラリを通してランタイムで安全に型を確定させること（Parse, don't validate）。
- **厳格なNull/Undefinedチェック**:
  - 存在しないかもしれないオブジェクトプロパティに対するアクセスは、オプショナルチェイニング（`?.`）や Nullish Coalescing（`??`）を用いて安全に処理し、実行時エラー（`Cannot read properties of undefined`）を根絶する。

## 3. Automated Quality Enforcement (自動化された品質保証)

- **Linter-First (リンター主導)**:
  - コード規約（ESLint, Prettier）、およびドキュメント品質（Harness EngineeringのためのFrontmatter・構造リンター）の制約を「破る」ようなPRを作成してはならない。エラーが出た場合は、リンター設定を弱めるのではなく、コード側を正しく修正すること。
- **Doc-Gardening**:
  - コードを変更したことによって `docs/` 配下の仕様書や方針に矛盾が生じた場合は、コードの変更と同一の修正単位でドキュメントもアップデートすること。ドキュメントはコメントと同様、常にコードと同期した生きた知識ベースである。
