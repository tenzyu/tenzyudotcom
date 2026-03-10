---
name: harness-frontend
description: フロントエンドの実装ルール。アーキテクチャ、ファイル配置、コンポーネント指向、およびNext.jsとReactのベストプラクティス。
summary: Next.js App RouterとReact Server/Client Componentsの境界を正しく扱い、保守性とパフォーマンスを限界まで高めるための技術規律。
read_when:
  - コンポーネントを新規作成、またはリファクタリングする時
  - ページ間でのデータの受け渡しやステート管理を実装する時
  - React/Next.jsのパフォーマンス最適化が必要な時
skip_when:
  - APIルートやサーバー・データベース専用のロジックのみを実装している時
user-invocable: false
---

# Frontend Architecture Rules (FRONTEND)

このドキュメントは、ReactおよびNext.js (App Router) におけるフロントエンド実装の**ゴールデンプリンシプル**である。

## 1. 原則: Local-first, Promote-later

フロントエンドの実装において最も重要な文脈は `local-first, promote-later` である。再利用の「可能性」を理由に安易な共有化（Premature Abstraction）を行ってはならず、実際の「再利用の事実」が発生した段階で昇格（Promote）させる。

## 2. Directory Strictness (厳密なディレクトリと所有権モデル)

コンポーネント指向（UI/Shell/Feature）は、単なるディレクトリ分けではなく「変更責務の所有者」を明確化するものである。以下の優先順で配置先を決定し、明確に分類すること。

1. **Route-local feature** (`src/app/[locale]/.../<route>/_features/*`):
   - 特定の1ルートでのみ使用されるセクションUIやロジックの実装場所。まずはフラットに保ち、複雑になった場合のみサブディレクトリを作成する。
2. **Shared feature** (`src/features/<domain>`):
   - 複数ルートで共有されるビジネスロジックやドメイン固有コンポーネント。プロダクトの特定の責務（例: portfolio, notes）をカプセル化する。`site-ui` にドメイン知識を押し込まず、ここへ配置する。
3. **Site shell** (`src/components/shell`):
   - サイト全体の骨格（Header, Footer など）。ビジネス機能を持たせない。
4. **Site-ui component** (`src/components/site-ui`):
   - サイト全体で共有されるプレゼンテーションコンポーネント。ドメイン知識や特定のワークフローを持たないプリミティブに限定する。
5. **Vendor UI / Design System** (`src/components/ui/`):
   - shadcn/ui などのベンダーソース固定層。純粋なUI部品（Button, Input等）であり、改変が必要な場合でもこのディレクトリから移動させない。ここにドメイン起因のデータフェッチを入れてはならない。

## 3. Next.js Routing Conventions

Next.js のルートコンベンションファイル（`page.tsx`, `layout.tsx` など）は、フレームワークとルート固有（Route-local）の機能をつなぐ「エントリーポイント」としてのみ扱う。

- **行うべきこと**: パラメータの受け取り、認証ガード、プロバイダの接続、ルート固有コンポーネントのレンダー。原則として Server Components を使用する。
- **避けるべきこと**: 複雑なデータフェッチ後の変換、SEOメタデータの内部組み立て、ビューモデルの生成、複雑な状態管理。これらは Feature 側の `*.assemble.ts` などへ委譲する。

## 4. コンポジションパターン (Composition & RSC Payload)

- トップレベルから末端のコンポーネントまで、すべてのデータをProps経由でバケツリレー（Prop Drilling）するのを防ぐ。
- Server Components でデータを取得・処理し、Client Components にはシリアライズ可能な最小限のデータ（RSC Payload）のみを渡し、`children` props などを活用したコンポジションを推奨する。

## 5. Vercel React Best Practices (パフォーマンス最適化)

フロントエンドのパフォーマンスを最適化するために、以下の原則を厳守する。

- **Eliminating Waterfalls (CRITICAL)**: `await`は実際にデータが必要になる分岐まで遅らせる、または`Promise.all`で並列化する。
- **Bundle Size Optimization (CRITICAL)**: 巨大なライブラリや重いクライアントコンポーネントは`next/dynamic`で非同期インポートする。不要なBarrel Files（`index.ts`での一括エクスポート）を避ける。
- **Re-render Optimization**: コールバック内にのみ必要なステートは変更時に再レンダリングを引き起こさないよう分離する。`useEffect`の乱用を避け、導出ステートはレンダリング中に計算する（`useMemo`の適切な使用）。

## 6. Separation of Logic and Presentation (ロジックと見た目の分離)

- **カスタムフックへの抽出**: コンポーネント内で状態管理（`useState`, `useReducer`）やDOM監視（`IntersectionObserver`など）、データ取得の副作用（`useEffect`）が膨らんだ場合、それらは即座に専用のカスタムフック（例: `useActiveHeadline`）に分離すること。
- **Dirty Codeの防止**: 1つのファイルが100行を超え、かつ複数の責務（例えば「リストの取得」と「スクロール監視」と「複雑なインラインスタイリング」）を持っている場合、それはリファクタリングの対象となる。
