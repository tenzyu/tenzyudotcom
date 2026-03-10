# Project Architecture Rules

**Version 1.0.0**
Engineering
March 2026

> **Note:**
> This document is mainly for agents and LLMs to follow when maintaining,
> generating, or refactoring the codebase. It defines the core constraints
> and patterns that ensure consistency across all modules.

---

## Abstract

This document aggregates granular architectural rules derived from the site's
design philosophy. It prioritizes local-first development, strict ownership
boundaries, and automated verification to maintain high technical integrity.

---

## Table of Contents

1. [Foundations](#1-foundations)
   - 1.1 [6-Layer Ownership Model](#11-6-layer-ownership-model)
   - 1.2 [Tool Boundary & Ownership](#12-tool-boundary-ownership)
   - 1.3 [Path & Feature Semantics](#13-path-feature-semantics)
   - 1.4 [Local-first, Promote-later](#14-local-first-promote-later)
   - 1.5 [Directory Strictness](#15-directory-strictness)
   - 1.6 [Dependency Inversion Pattern](#16-dependency-inversion-pattern)
   - 1.7 [Vertical Slice Architecture (VSA)](#17-vertical-slice-architecture-vsa-)
2. [Security & Safety](#2-security-safety)
   - 2.1 [Verification Guard](#21-verification-guard)
   - 2.2 [Security: Env Parsing & Centralization](#22-security-env-parsing-centralization)
   - 2.3 [Structural & Mutation Guards](#23-structural-mutation-guards)
   - 2.4 [Security: Outbound Boundary & Zero Trust](#24-security-outbound-boundary-zero-trust)
3. [Implementation](#3-implementation)
   - 3.1 [Separation of Logic and Presentation](#31-separation-of-logic-and-presentation)
   - 3.2 [No Dirty Code Policy](#32-no-dirty-code-policy)
   - 3.3 [Bundle & Discovery Hygiene](#33-bundle-discovery-hygiene)
   - 3.4 [Performance Optimization](#34-performance-optimization)
   - 3.5 [Contract & Boundary Validation](#35-contract-boundary-validation)
   - 3.6 [Composition Patterns](#36-composition-patterns)
   - 3.7 [Next.js Routing Conventions](#37-next-js-routing-conventions)
4. [UI & UX](#4-ui-ux)
   - 4.1 [Token-first Styling](#41-token-first-styling)
   - 4.2 [Accessibility by Default](#42-accessibility-by-default)
5. [Intelligence](#5-intelligence)
   - 5.1 [Harness Engineering](#51-harness-engineering)
   - 5.2 [i18n: Meaning vs Data Separation](#52-i18n-meaning-vs-data-separation)
   - 5.3 [Memory Layers & Persistence](#53-memory-layers-persistence)
   - 5.4 [Editorial Role Separation](#54-editorial-role-separation)
   - 5.5 [Decision Priority Order](#55-decision-priority-order)
   - 5.6 [Product Core Values](#56-product-core-values)
   - 5.7 [Normative: Target over Current](#57-normative-target-over-current)
6. [Reliability](#6-reliability)
   - 6.1 [Reliability: Metadata & i18n Safety](#61-reliability-metadata-i18n-safety)
   - 6.2 [Reliability: Fault Tolerance & Isolated Boundaries](#62-reliability-fault-tolerance-isolated-boundaries)

---

## 1. Foundations <a id="1-foundations"></a>

### 1.1 6-Layer Ownership Model <a id="11-6-layer-ownership-model"></a>

**Impact: HIGH**

> 全てのコードに一意の所有者を定義し、配置迷子（Dumping Ground）を根絶する。

コードの「役割」や「構文」ではなく、「誰がその責任を持つか」に基づいて配置を決定する。

1. **local feature**: `src/app/.../_features/` (特定のルート専用)
2. **promoted feature**: `src/features/` (複数ルートで再利用されるドメイン機能)
3. **site shell**: `src/components/shell/` (サイトの骨格)
4. **site-ui component**: `src/components/site-ui/` (汎用プレゼンテーション部品)
5. **pure shared logic**: `src/lib/`, `src/config/` (クロスルートの純粋ロジック・設定)
6. **authored content**: `src/content/` (MDX 等の人間が管理するコンテンツ)

**Incorrect:**

```text
// 1箇所でしか使わないのに、最初から src/components/ に置いてしまう
src/components/SpecificButton.tsx
```

**Correct:**

```text
// 使う場所の隣から始め、再利用の事実が出たら昇格（Promote）させる
src/app/[locale]/.../_features/specific-button.tsx
```

### 1.2 Tool Boundary & Ownership <a id="12-tool-boundary-ownership"></a>

**Impact: HIGH**

> ツールの責務を明確にし、密結合による交換不可能性を防ぐ。

それぞれの道具が担当する境界を厳守する。

| Concern | Owner | Must NOT become |
| :--- | :--- | :--- |
| Localized meaning | Intlayer | fetch input registry / database |
| Base UI | shadcn/ui | domain-aware features |
| Presentation | `site-ui` | domain logic / workflow store |
| Domain logic | `features/` | generic presentation library |

**Incorrect:**

```typescript
// Intlayer の辞書ファイルに、外部 API の ID や URL を直接書き込む
// shadcn の Button.tsx の中に、ブログ記事取得のロジックを書く
```

**Correct:**

```typescript
// 識別子は source.ts に置き、Intlayer と結合する
// shadcn はプリミティブとして使い、Feature 側でラップしてビジネスロジックを載せる
```

### 1.3 Path & Feature Semantics <a id="13-path-feature-semantics"></a>

**Impact: HIGH**

> ファイルパスを一意の識別子として使い、探索コストを最小化する。

ディレクトリ名は「技術分類」よりも「機能属性」を優先する。

- **`_features/`**: ルート内スライス。
- **`components/`**, **`hooks/`**, **`lib/`**: これらはトップレベルではなく、feature ディレクトリの内部を整理するために使う。
- **Small Features Stay Flat**: ファイル数が 5 つ程度まではサブディレクトリを作らず、フラットに保つ。

**Incorrect:**

```text
// ファイルが少ないのに最初から lib/ や components/ フォルダを掘る
src/app/.../_features/
  ├── components/
  │   └── my-button.tsx
  └── lib/
      └── utils.ts
```

**Correct:**

```text
// まずはフラットに配置し、読み筋が分かれ始めてからフォルダを掘る
src/app/.../_features/
  ├── my-button.tsx
  └── utils.ts
```

### 1.4 Local-first, Promote-later <a id="14-local-first-promote-later"></a>

**Impact: HIGH**

> 早期の抽象化を防ぎ、機能の独立性を高めることで変更の波及を抑える。

再利用の「可能性」ではなく、実際の「再利用の事実」に基づいて共有化（Promote）を行う。
まずは利用箇所の最も近く（route-local な `_features` 配下）に配置し、2箇所以上のルートで必要になった段階で `src/features` 等へ昇格させる。

**Incorrect:**

```tsx
// 再利用されるかもしれないという理由で、最初から共通ディレクトリに置く
// src/components/site-ui/SpecificFeatureButton.tsx
```

**Correct:**

```tsx
// まずは使う場所（ルート内）の近くに置く
// src/app/[locale]/(main)/notes/_features/note-action-button.tsx
```

### 1.5 Directory Strictness <a id="15-directory-strictness"></a>

**Impact: HIGH**

> 構造を「技術分類」ではなく「変更責務（所有権）」で分けることで、影響範囲を自明にする。

コンポーネントの配置先は、Next.js の構文（components/hooks等）よりも、変更責務の所有者を優先して決定する。

1. **Route-local feature**: そのルート専用。 `_features/*` 配下に置く。
2. **Shared feature**: 複数ルート。 `src/features/<domain>` に置く。
3. **Site shell**: サイト全体の骨格。 `src/components/shell` に置く。
4. **Site-ui component**: ドメイン知識を持たない汎用部品。 `src/components/site-ui` に置く。
5. **Vendor UI**: デザインシステム本体。 `src/components/ui` に置く。

**Incorrect:**

```tsx
// ドメイン知識（例: ブログのタグ）を持ったコンポーネントを site-ui に置く
// src/components/site-ui/BlogTag.tsx
```

**Correct:**

```tsx
// ドメイン知識を持つなら Feature 配下に置く
// src/features/blog/components/blog-tag.tsx
```

### 1.6 Dependency Inversion Pattern <a id="16-dependency-inversion-pattern"></a>

**Impact: MEDIUM**

> ロジックを外部実装（API, DB）から保護し、テストの容易性と交換可能性を高める。

mount point や外部ツールに惑わされず、どこがロジックと状態と知識を所有するかを明確に分離する。

- `*.domain.ts`: 純粋な型とビジネスルール。
- `*.contract.ts`: 境界（外部実装との接続点）の定義とバリデーション。
- `*.assemble.ts`: 複数のデータソースを結合し、UI に適した形状に組み立てる。

**Incorrect:**

```tsx
// UI コンポーネントの中で直接 API のレスポンス形状に依存している
export default function Component() {
  const data = await fetch('/api/raw-data');
  return <div>{data.raw_field_name}</div>;
}
```

**Correct:**

```tsx
// 境界（Contract）でパースし、ドメインモデルへ変換してから UI に渡す
const data = MyContract.parse(await fetch('/api/raw-data'));
return <Presentation item={data} />;
```

### 1.7 Vertical Slice Architecture (VSA) <a id="17-vertical-slice-architecture-vsa-"></a>

**Impact: HIGH**

> 変更の影響をスライス内に閉じ込め、機能単位での開発・削除を容易にする。

レイヤーによる水平分割（UI層、Logic層、Data層）ではなく、機能（Feature）による垂直分割を基本とする。
Next.js のルートディレクトリ内に `_features` サブディレクトリを作成し、その中に UI、Logic、Data を一つのスライスとして閉じ込める。

**Incorrect:**

```text
// レイヤーで分かれている（機能 A を直すのに 3 箇所見る必要がある）
src/components/FeatureA.tsx
src/hooks/useFeatureA.ts
src/types/feature-a.ts
```

**Correct:**

```text
// 機能で閉じている（機能 A のスライス内で完結する）
src/app/[locale]/.../route/_features/
  ├── feature-a.tsx
  ├── feature-a.model.ts
  └── feature-a.hook.ts
```

---

## 2. Security & Safety <a id="2-security-safety"></a>

### 2.1 Verification Guard <a id="21-verification-guard"></a>

**Impact: CRITICAL**

> デプロイ不可能なコードの混入を防ぎ、変更の正しさを客観的に証明する。

全ての変更は、実行可能な検証（Verification）を最低 1 つは通さなければならない。

- **Build/Lint**: ランタイムやデータフローを触ったら `build`、構文や config を触ったら `lint` を通す。
- **Tests**: 影響範囲に応じたテストを実行する。特に正規化や複雑なロジックを触った場合はテスト追加を優先する。
- **Nix Entry**: `nix develop -c <command>` を標準の検証入り口として使用し、環境差異を排除する。

**Incorrect:**

```text
// 「コードを書いたので完了です」と報告し、一度もビルドやテストを走らせない
// エラーが出ているが「手元の環境では動く」として無視する
```

**Correct:**

```text
// 変更後、nix develop 下で lint と build が通ることを確認してから完了とする
// 新しいロジックには必ず regression test を追加し、成功を証明する
```

### 2.2 Security: Env Parsing & Centralization <a id="22-security-env-parsing-centralization"></a>

**Impact: CRITICAL**

> ブラウザへの機密情報の漏洩を防ぎ、すべての環境変数の型安全性を確保する。

環境変数は `src/config/` 内の `env.contract.ts` などで一括してパース・検証を行う。
`process.env` を複数ファイルから直接参照することを禁止し、機密情報の露出を最小化する。

- **接頭辞 `NEXT_PUBLIC_`**: クライアント側（ブラウザ）に露出しても安全なもの。
- **それ以外**: サーバーサイドでのみ使用する機密情報。

**Incorrect:**

```tsx
// 複数のファイルで process.env を直接呼び出し、型も不明
const apiKey = process.env.API_KEY;
```

**Correct:**

```tsx
// env.contract.ts で一括管理し、型安全なオブジェクトをインポートする
import { env } from "@/config/env.contract";
```

### 2.3 Structural & Mutation Guards <a id="23-structural-mutation-guards"></a>

**Impact: HIGH**

> 破壊的な操作や意図しない変更を最小限に抑え、リポジトリの整合性を守る。

実行中にリポジトリの構造と状態を守るための制約を適用する。

- **Structural Guard**: ファイル配置は `structure-rules.md` を正本とする。現状がターゲットとズレている場合、変更のついでにターゲットへ寄せる。
- **Mutation Guard**: 無関係な変更（Unrelated changes）を巻き戻さない。ユーザーが行った手動変更を勝手に消さない。

**Incorrect:**

```text
// 既存の正しい構造を、自分の都合に合わせて勝手に崩す
// バグ修正のついでに、全く関係のないファイルのフォーマットを書き換える
```

**Correct:**

```text
// 既存のパターンを尊重しつつ、ターゲットアーキテクチャに一歩近づける
// 修正対象のスコープにのみ集中して surgical な変更を行う
```

### 2.4 Security: Outbound Boundary & Zero Trust <a id="24-security-outbound-boundary-zero-trust"></a>

**Impact: CRITICAL**

> 外部入力をゼロトラスト前提で検証し、不正アクセスや改ざんを防ぐ。

Query パラメータ、Path パラメータ、POST ボディ等の外部入力を受け付ける際、必ず Zod でスキーマ検証を行い、未知のデータを拒否する。
「クライアント側でバリデーションされている」という前提に依存せず、サーバーサイドで厳格にガードする。

- **Server Actions & Route Handlers**: グローバルに公開されたエンドポイントであることを自覚し、認証・認可の権限チェックを最上部で行う。

**Incorrect:**

```tsx
// 入力をそのまま DB 操作等に使用する
export async function myAction(id: string) {
  return await db.update(id, ...);
}
```

**Correct:**

```tsx
// 入力をスキーマで検証し、権限をチェックしてから実行する
export async function myAction(unsafeId: string) {
  const id = IdSchema.parse(unsafeId);
  await checkAuth(id);
  return await db.update(id, ...);
}
```

---

## 3. Implementation <a id="3-implementation"></a>

### 3.1 Separation of Logic and Presentation <a id="31-separation-of-logic-and-presentation"></a>

**Impact: HIGH**

> 1つのファイルに複数の責務が混ざることを防ぎ、テスタビリティと可読性を向上させる。

コンポーネント内での状態管理や副作用が膨らんだ場合、それらは即座に専用のカスタムフック（例: `useActiveHeadline`）に分離する。
1つのファイルが100行を超え、複数の責務（例: リストの取得とスクロール監視）を持っている場合はリファクタリングの対象となる。

**Incorrect:**

```tsx
// 1つのコンポーネントに副作用、DOM 監視、スタイルが混在する
export default function Component() {
  const [state, setState] = useState(0);
  useEffect(() => { ... }, []); // 複雑な DOM 監視など
  return <div style={{ color: 'red' }}>{state}</div>;
}
```

**Correct:**

```tsx
// ロジックをカスタムフックに抽出し、見た目はプレゼンテーションに専念させる
export default function Component() {
  const { state } = useMyCustomLogic();
  return <PresentationalView state={state} />;
}
```

### 3.2 No Dirty Code Policy <a id="32-no-dirty-code-policy"></a>

**Impact: MEDIUM**

> 肥大化した不透明なコンポーネントを抑制し、保守性を維持する。

「動いているから」という理由だけで、複数の責務が混ざった巨大なコード（Dirty Code）を放置することを許容しない。
リファクタリング（Garbage Collection）を継続的に行い、コードベースをクリーンに保つ。

**Incorrect:**

```tsx
// 1つのファイルに複数の責務が混ざり、100行を超える
export default function DirtyComponent() {
  // fetching, state, intersection observer, complex styles...
  return <div>...</div>;
}
```

**Correct:**

```tsx
// 小さな責務に分割し、それぞれを独立させる
export default function CleanComponent() {
  const { data } = useResource();
  return <Presentation data={data} />;
}
```

### 3.3 Bundle & Discovery Hygiene <a id="33-bundle-discovery-hygiene"></a>

**Impact: HIGH**

> バンドルサイズの肥大化を防ぎ、コードの所有権を明示的にする。

内部コードの Barrel Import（`index.ts` による一括エクスポート）は原則禁止とする。

- **Explicit Import**: 具体的なファイル名を指定してインポートし、探索経路を縮める。
- **No index.ts**: 同一ディレクトリ内であっても `./lib` のような省略インポートを避け、所有権を可視化する。

**Incorrect:**

```typescript
// 内部ファイルを index.ts でまとめてエクスポートし、他から一括インポートする
import { a, b, c } from "@/features/notes"; // 全ての依存が読み込まれるリスク
```

**Correct:**

```typescript
// 必要なファイルのみを直接指定してインポートする
import { a } from "@/features/notes/components/a";
```

### 3.4 Performance Optimization <a id="34-performance-optimization"></a>

**Impact: HIGH**

> 初期ロードの高速化と、インタラクションの応答性を限界まで高める。

フロントエンドのパフォーマンスを最適化するために、ウォーターフォールの排除、バンドルサイズの抑制、不要な再レンダリングの抑制を徹底する。

- **Eliminating Waterfalls**: `await` は実際に必要になるまで遅らせるか、`Promise.all` で並列化する。
- **Bundle Size**: 巨大なライブラリやクライアントコンポーネントは `next/dynamic` で非同期インポートする。不要な Barrel Files（`index.ts` の一括エクスポート）を避ける。
- **Re-render**: `useEffect` の乱用を避け、導出ステートはレンダリング中に計算する。

**Incorrect:**

```tsx
// 逐次実行によるウォーターフォール（100ms + 100ms = 200ms）
const a = await getA();
const b = await getB();
```

**Correct:**

```tsx
// 並列実行（Max(100ms, 100ms) = 100ms）
const [a, b] = await Promise.all([getA(), getB()]);
```

### 3.5 Contract & Boundary Validation <a id="35-contract-boundary-validation"></a>

**Impact: HIGH**

> 外部からの不明なデータによるランタイムエラーを防ぎ、型安全性を確保する。

外部 API、MDX の Frontmatter、URL 検索パラメータなどの境界（Boundary）で受け取るデータは、必ず Zod 等のスキーマバリデーションを通して検証し、型を確定（正規化）させる。

**Parse, don't validate**: データをチェックするだけでなく、信頼できる形状へ変換してから内部へ流す。

**Incorrect:**

```tsx
// 外部からの JSON をそのままキャストして使う
const data = await res.json() as UnsafeType;
```

**Correct:**

```tsx
// Zod スキーマでパースし、型安全な形状を保証する
const data = MySchema.parse(await res.json());
```

### 3.6 Composition Patterns <a id="36-composition-patterns"></a>

**Impact: HIGH**

> プロップ・ドリリングを抑制し、RSC ペイロードを最小化することで、保守性とパフォーマンスを向上させる。

トップレベルからのプロップ・ドリリング（Prop Drilling）を防ぐため、`children` props などを活用したコンポジションを推奨する。
Server Components でデータを取得し、Client Components にはシリアライズ可能な最小限のデータのみを渡すように設計する。

**Incorrect:**

```tsx
// Client Component に巨大なオブジェクト全体を渡してバケツリレーする
<ClientParent data={hugeData} />
```

**Correct:**

```tsx
// Server Component で子要素を組み立て、children として渡す
<ClientParent>
  <ServerChild data={neededPart} />
</ClientParent>
```

### 3.7 Next.js Routing Conventions <a id="37-next-js-routing-conventions"></a>

**Impact: MEDIUM**

> エントリーポイントを薄く保ち、ロジックをスライスに委譲することで、フレームワークへの依存を局所化する。

`page.tsx`, `layout.tsx` などのルートコンベンションファイルは、フレームワークとルート固有の機能を接続する「エントリーポイント」としてのみ扱う。

- **Do**: パラメータの受け取り、認証ガード、Feature コンポーネントのレンダー。
- **Don't**: データの加工ロジック、SEO メタデータの組み立て、ビューモデルの生成。

**Incorrect:**

```tsx
// page.tsx で複雑なマッピングや SEO 構築をすべて行う
export default async function Page({ params }) {
  const data = await fetchData(params.id);
  const metadata = { title: data.name }; // Metadata はここではなく generateMetadata へ
  return <div>{data.items.map(i => <Item i={i} />)}</div>;
}
```

**Correct:**

```tsx
// page.tsx は委譲に留める
export default async function Page({ params }) {
  const { items } = await getNotesPageData(params.id);
  return <NotesList items={items} />;
}
```

---

## 4. UI & UX <a id="4-ui-ux"></a>

### 4.1 Token-first Styling <a id="41-token-first-styling"></a>

**Impact: HIGH**

> デザインの一貫性を保ち、マジックナンバーによる保守性の低下を防ぐ。

全てのスタイリングは TailwindCSS のユーティリティクラス（トークン）を用いて行う。コンポーネントに直接 `px` 単位の数値をハードコードしたり、場当たり的な色を指定することを禁止する。

- **HSLベース**: 調和の取れたカラーパレットを使用する。
- **shadcn/ui**: 基盤コンポーネントのバリアントを再利用する。

**Incorrect:**

```tsx
// マジックナンバーやハードコードされた色
<div style={{ padding: '13px', color: '#ff0000' }}>
```

**Correct:**

```tsx
// トークン（Tailwind クラス）を使用
<div className="p-3 text-destructive">
```

### 4.2 Accessibility by Default <a id="42-accessibility-by-default"></a>

**Impact: MEDIUM**

> 全てのユーザーが利用可能で、かつ検証しやすい UI 構造を維持する。

Semantic HTML を遵守し、WAI-ARIA ガイドラインに従う。見た目のためだけの `div` 多用を避け、スクリーンリーダーやキーボード操作に対応させる。

- **Semantic Elements**: `header`, `nav`, `main`, `article`, `section`, `footer` を適切に使い分ける。
- **Unique IDs**: インタラクティブ要素にはブラウザテストのための説明的な ID を付与する。

**Incorrect:**

```tsx
// 意味のない div の羅列。ボタンなのにクリックイベントを div に付ける
<div onClick={...}>Click me</div>
```

**Correct:**

```tsx
// セマンティックな HTML。ボタン要素を使い、アクセシビリティを確保
<button id="submit-button" onClick={...}>Submit</button>
```

---

## 5. Intelligence <a id="5-intelligence"></a>

### 5.1 Harness Engineering <a id="51-harness-engineering"></a>

**Impact: HIGH**

> エージェントが自律的にリポジトリを理解し運用するための基盤を維持する。

ドキュメント駆動型インフラ（ハーネス）を維持する。コード変更時は常にドキュメントとの整合性を保ち、暗黙知を排除する。

- `AGENTS.md`: 全ドキュメントの目次。エージェントの現在地を把握する。
- `docs/exec-plans/completed/*.md`: 過去の成功・失敗の証拠を永続化し、同じ誤りを防ぐ。

**Incorrect:**

```text
// ドキュメントを更新せずにアーキテクチャを変更する
// 過去の失敗（Case Memory）を無視して同じ実装ミスを繰り返す
```

**Correct:**

```text
// 構造変更時は docs/design-docs/*.md も同時に修正する
// 複雑な判断の経緯は docs/exec-plans/completed/ に残す
```

### 5.2 i18n: Meaning vs Data Separation <a id="52-i18n-meaning-vs-data-separation"></a>

**Impact: HIGH**

> 識別子と翻訳文を分離し、データ更新と多言語化の疎結合を実現する。

国際化は単なるテキスト置換ではなく、「意味（Meaning）」と「データ（Identifiers）」の分離として定義する。

- **`*.source.ts`**: ID、URL、ハンドル等の安定した「データ（Source of Truth）」。
- **`*.content.ts`**: Intlayer を通じた、ユーザーに見える「意味（文言、説明）」。
- **`*.assemble.ts`**: ID をキーにして、データと意味を結合する。

**Incorrect:**

```typescript
// 翻訳データの中に外部 ID や URL を直接含めてしまう
export const content = {
  linkUrl: "https://example.com/id-123", // データの変更で翻訳ファイルの修正が必要になる
  linkLabel: "Click here"
};
```

**Correct:**

```typescript
// 識別子は source に、文言は content に分ける
// item.source.ts -> { id: "id-123", url: "..." }
// item.content.ts -> { label: "Click here" }
```

### 5.3 Memory Layers & Persistence <a id="53-memory-layers-persistence"></a>

**Impact: MEDIUM**

> 情報を適切な寿命と場所に保存し、コンテキストの汚染と忘却を防ぐ。

情報の性質に応じて寿命と保存先を分ける。

1. **Session**: 作業中のみ。完了後に捨てる（いま触っているファイル等）。
2. **Repo/Structural**: `AGENTS.md` やフォルダ構造自体。常に読み直す。
3. **Durable**: `design-docs` (ルール) と `exec-plans/completed` (具体的な成功・失敗事例)。

**Incorrect:**

```text
// 恒久的なルールを一時的な TODO コメントとして放置する
// 過去の失敗事例をドキュメントに残さず、次のセッションで同じミスをする
```

**Correct:**

```text
// 複数箇所で再発した曖昧さは design-docs にルールとして昇格させる
// 今回のタスクで得た具体的な教訓は completed ログに残す
```

### 5.4 Editorial Role Separation <a id="54-editorial-role-separation"></a>

**Impact: MEDIUM**

> 文言の役割（メタデータ、見出し、本文、ナビ）を分離し、UX と SEO を両立させる。

全ての文言を一律に扱わず、その露出場所と目的に応じて役割を分離する。

- **Metadata**: 検索・共有用。主題を優先し、詩的な表現を避ける。
- **Page Header**: 訪問者への導入。Metadata より expressive で良い。
- **Page Lead**: ページの内容を 1〜2 文で説明。Metadata Description を流用しない。
- **Nav/Tile**: 1 行で行き先を判断させる。Page Lead を流用しない。

**Incorrect:**

```text
// 検索結果用の Metadata Description を、ページ冒頭の導入文としてそのまま表示する
// ナビゲーションの短いラベルに、詳細な説明文を詰め込む
```

**Correct:**

```text
// ページを開く前（Nav）と開いた後（Lead）で、情報の粒度を適切に変える
// 検索エンジン向けの文言と、人間向けの表現を区別する
```

### 5.5 Decision Priority Order <a id="55-decision-priority-order"></a>

**Impact: HIGH**

> 複数の設計原理が衝突した際の判断基準を明確にし、一貫性を保つ。

設計判断では以下の優先順位を遵守する。

1. **Ownership**: そのコードの所有者は誰か（Local か Shared か）。
2. **Attribute**: 最上位属性は何か（Feature, Shell, Site-UI, Logic, Content）。
3. **Workflow & Proximity**: 作業動線と近接性を優先し、認知負荷を下げる。
4. **Pattern**: 構文的な整理（Pattern 分割）は最後に行う。
5. **Promote**: 実際の再利用が発生した後に共通化する。

**Incorrect:**

```text
// 構文の美しさ（Pattern）を優先して、機能のまとまり（Workflow）をバラバラにする
// 将来的な再利用を予想して、最初から Shared に配置する
```

**Correct:**

```text
// 修正時に同時に触るファイルを近くに置く（Proximity）
// 2箇所以上で使われるまでは、特定のルート内に閉じ込める
```

### 5.6 Product Core Values <a id="56-product-core-values"></a>

**Impact: MEDIUM**

> サイトの長期的価値を保護し、不要な機能の肥大化を防ぐ。

このサイトは「Durable Memory（永続的な記憶）」と「Living Curation（生きたキュレーション）」のための「庭（Garden）」である。

- **Owned Identity**: 制作物と文体を自分のドメインに集約する。
- **Utility for Self**: 自分自身が毎日使うための道具（Pointers等）を持つ。
- **Lightweight Admin**: 更新の摩擦を極限まで減らし、継続性を重視する。

**Incorrect:**

```text
// 自分では使わない、単なる見栄えのための複雑な機能を追加する
// 更新が面倒な重厚な CMS 機能を導入し、更新が途絶える
```

**Correct:**

```text
// 自分が毎日開きたくなるような便利なダッシュボード機能を優先する
// スマホからでも 1 分でリンクを追加できる軽量な仕組みを維持する
```

### 5.7 Normative: Target over Current <a id="57-normative-target-over-current"></a>

**Impact: HIGH**

> 既存の負債に引きずられず、一貫したターゲット構造へ収束させる。

このリポジトリの設計文書は、現状のコード（Current Code）に迎合しない。現状がターゲット（Target Architecture）とズレている場合、その現状を正当化せず、解消すべき負債として扱う。

- **ターゲット優先**: 現状の実装よりも設計原則を優先して評価する。
- **逐次改善**: 一度の変更で全て移行できなくても、局所的にターゲットへ近づける。
- **慣性の停止**: 既存コードを真似てはいけない箇所は、Harness（ドキュメント）側で明確に宣言する。

**Incorrect:**

```text
// 「既存の他のファイルがこうなっているから」という理由で、悪い設計を繰り返す
// 現状の配置に合わせて、ターゲットアーキテクチャの方を書き換える
```

**Correct:**

```text
// 現状が間違っていることを認め、新しい変更では正しい原則を適用する
// 前例（Precedent）にするべきでない箇所を明記し、AI の模倣を止める
```

---

## 6. Reliability <a id="6-reliability"></a>

### 6.1 Reliability: Metadata & i18n Safety <a id="61-reliability-metadata-i18n-safety"></a>

**Impact: HIGH**

> 検索エンジンのインデックスや、各ロケールでの SEO 情報を確実に生成・反映させる。

`sitemap.ts` や `robots.ts` 等の重要なメタデータを生成する際、不確かなロケール推論やリクエストヘッダー（Host 等）に頼らず、確定された単一の環境変数（`SITE_URL` 等）から絶対パスを出力する。

- **i18n Metadata**: すべてのサポートロケールリストを明示的にループし、`alternates` 等がすべての言語間で漏れなく生成されることをビルド時または実行時に保証する。

**Incorrect:**

```tsx
// 相対パスや Host ヘッダーに依存した URL 生成
const url = `https://${headers().get('host')}/sitemap.xml`;
```

**Correct:**

```tsx
// 環境変数から得られた絶対パスを使用する
const url = `${env.SITE_URL}/sitemap.xml`;
```

### 6.2 Reliability: Fault Tolerance & Isolated Boundaries <a id="62-reliability-fault-tolerance-isolated-boundaries"></a>

**Impact: HIGH**

> サイトの一部（単一の機能やツール）でのエラーが全体を巻き込んでクラッシュさせないようにする。

独立したアプリケーションや機能モジュール（例: `/tools/*` 内のミニアプリ）は、必ず自立したエラー境界（`ErrorBoundary`）を持つ。
一部のレンダリング例外が、システム全体のページ表示やグローバルレイアウト（ヘッダー・フーター等）まで巻き込んでクラッシュさせないように設計する。

- **Fail-Open**: データの取得失敗時（Not Found）は、UI 側で空状態やフォールバックコンポーネントを表示することを許容する。
- **Fail-Closed**: スキーマ検証エラーやバックエンド API のダウン時等、誤動作や不正な保存を防ぐため、安全に Reject し再試行を促す。

**Incorrect:**

```tsx
// サブコンポーネントのエラーがページ全体の白紙化を引き起こす
export default function Page() {
  return (
    <Layout>
      <SubComponent /> {/* ここでクラッシュすると Layout も道連れ */}
    </Layout>
  );
}
```

**Correct:**

```tsx
// ErrorBoundary で被害範囲を局所化する
export default function Page() {
  return (
    <Layout>
      <ErrorBoundary fallback={<FallbackUI />}>
        <SubComponent />
      </ErrorBoundary>
    </Layout>
  );
}
```

## References

1. [Root AGENTS.md](../../AGENTS.md)
2. [Project Design Docs](../design-docs/)
