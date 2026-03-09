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

## 1. Directory Strictness (厳密なディレクトリと責務の分割)

コンポーネントは以下の3つの階層のいずれかに明確に分類されなければならない。

- `src/components/ui/` (Design System):
  - 特定のビジネスロジックを持たない、サイト全体で共有される純粋なUI部品（Button, Input, Dialog等）。
  - shadcn/ui をベースとする。ここにドメイン固有の知識やデータフェッチを入れてはならない。
- `src/features/` (Feature Modules):
  - 特定の機能やドメインに密結合したロジックとUIコンポーネント。
  - プロダクトの特定の責務（例: `portfolio`, `notes`）をカプセル化し、他の機能から独立させる。
- `src/app/` (Routing & Assembly):
  - Next.js のルーティング、レイアウト、およびページのアセンブリを担う。
  - 原則としてServer Componentsを使用し、`features/`や`ui/`からコンポーネントを呼び出して組み合わせるのが主な役割。ここで複雑な状態管理を行わない。

## 2. Vercel React Best Practices (パフォーマンス最適化)

フロントエンドのパフォーマンスを最適化するために、以下の原則を厳守する。

- **Eliminating Waterfalls (CRITICAL)**: `await`は実際にデータが必要になる分岐まで遅らせる、または`Promise.all`で並列化する。
- **Bundle Size Optimization (CRITICAL)**: 巨大なライブラリや重いクライアントコンポーネントは`next/dynamic`で非同期インポートする。不要なBarrel Files（`index.ts`での一括エクスポート）を避ける。
- **Re-render Optimization**: コールバック内にのみ必要なステートは変更時に再レンダリングを引き起こさないよう分離する。`useEffect`の乱用を避け、導出ステートはレンダリング中に計算する（`useMemo`の適切な使用）。
- **RSC Payload**: Server Component から Client Component に渡す `props` (シリアライズされるデータ) は最小限に保つ。

## 3. Separation of Logic and Presentation (ロジックと見た目の分離)

- **カスタムフックへの抽出**: コンポーネント内で状態管理（`useState`, `useReducer`）やDOM監視（`IntersectionObserver`など）、データ取得の副作用（`useEffect`）が膨らんだ場合、それらは即座に専用のカスタムフック（例: `useActiveHeadline`）に分離すること。
- **Dirty Codeの防止**: 1つのファイルが100行を超え、かつ複数の責務（例えば「リストの取得」と「スクロール監視」と「複雑なインラインスタイリング」）を持っている場合、それはリファクタリングの対象となる。
