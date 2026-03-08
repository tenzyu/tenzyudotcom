# FRONTEND

## 1. 原則: Local-first, Promote-later

フロントエンドの実装において最も重要な文脈は `local-first, promote-later` です。再利用の「可能性」を理由に安易な共有化（Premature Abstraction）を行ってはならず、実際の「再利用の事実」が発生した段階で昇格（Promote）させます。

## 2. 所有権モデル (Ownership Model)

コンポーネント指向（UI/Shell/Feature）は、単なるディレクトリ分けではなく「変更責務の所有者」を明確化するものです。以下の優先順で配置先を決定します。

1. **Route-local feature** (`src/app/[locale]/.../<route>/_features/*`):
   - 特定の1ルートでのみ使用されるセクションUIやロジックの実装場所。まずはフラットに保ち、複雑になった場合のみサブディレクトリを作成します。
2. **Shared feature** (`src/features/<domain>`):
   - 複数ルートで共有されるビジネスロジックやドメイン固有コンポーネント。`site-ui` にドメイン知識を押し込まず、ここへ配置します。
3. **Site shell** (`src/components/shell`):
   - サイト全体の骨格（Header, Footer など）。ビジネス機能を持たせません。
4. **Site-ui component** (`src/components/site-ui`):
   - サイト全体で共有されるプレゼンテーションコンポーネント。ドメイン知識や特定のワークフローを持たないプリミティブに限定します。
5. **Vendor UI** (`src/components/ui`):
   - shadcn/ui などのベンダーソース固定層。改変が必要な場合でも、このディレクトリから移動させません。

## 3. Next.js Routing Conventions

Next.js のルートコンベンションファイル（`page.tsx`, `layout.tsx` など）は、フレームワークとルート固有（Route-local）の機能をつなぐ「エントリーポイント」としてのみ扱います。
- **行うべきこと**: パラメータの受け取り、認証ガード、プロバイダの接続、ルート固有コンポーネントのレンダー。
- **避けるべきこと**: 複雑なデータフェッチ後の変換、SEOメタデータの内部組み立て、ビューモデルの生成。これらは Feature 側の `*.assemble.ts` などへ委譲します。

## 4. コンポジションパターン (Composition)

- トップレベルから末端のコンポーネントまで、すべてのデータをProps経由でバケツリレー（Prop Drilling）するのを防ぎます。
- Server Components でデータを取得・処理し、Client Components にはシリアライズ可能な最小限のデータのみを渡し、`children` props などを活用したコンポジションを推奨します。
