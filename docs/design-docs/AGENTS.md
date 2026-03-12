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
   - 1.1 [Dependency Inversion](#11-dependency-inversion)
   - 1.2 [Tool Boundaries](#12-tool-boundaries)
   - 1.3 [Feature Slice Structure](#13-feature-slice-structure)
   - 1.4 [Promotion By Usage](#14-promotion-by-usage)
   - 1.5 [Owner Placement Layers](#15-owner-placement-layers)
   - 1.6 [Authored Content Management](#16-authored-content-management)
2. [Security & Safety](#2-security-safety)
   - 2.1 [Editor Write Safety](#21-editor-write-safety)
   - 2.2 [Editor Session Boundary](#22-editor-session-boundary)
   - 2.3 [Verification Guard](#23-verification-guard)
   - 2.4 [Proxy Boundary](#24-proxy-boundary)
   - 2.5 [Server Actions Require Auth Even For Helper Actions](#25-server-actions-require-auth-even-for-helper-actions)
   - 2.6 [Structural & Mutation Guards](#26-structural-mutation-guards)
   - 2.7 [Security: Explicit Env Parsing & Centralization](#27-security-explicit-env-parsing-centralization)
   - 2.8 [Security: Outbound Boundary & Zero Trust](#28-security-outbound-boundary-zero-trust)
3. [Implementation](#3-implementation)
   - 3.1 [File Role Contract](#31-file-role-contract)
   - 3.2 [Separation of Logic and Presentation](#32-separation-of-logic-and-presentation)
   - 3.3 [Editor Errors And Blog Saving Should Cross Boundaries Via Port](#33-editor-errors-and-blog-saving-should-cross-boundaries-via-port)
   - 3.4 [Editor Collection Registration Contract](#34-editor-collection-registration-contract)
   - 3.5 [Parse At Boundaries](#35-parse-at-boundaries)
   - 3.6 [Apply DI Before UI Assembly](#36-apply-di-before-ui-assembly)
   - 3.7 [No Dirty Code Policy](#37-no-dirty-code-policy)
   - 3.8 [Avoid Route POST And Hard Reload For Inline Admin](#38-avoid-route-post-and-hard-reload-for-inline-admin)
   - 3.9 [Bundle & Discovery Hygiene](#39-bundle-discovery-hygiene)
   - 3.10 [Performance Optimization](#310-performance-optimization)
   - 3.11 [Locale Switcher Single Flow](#311-locale-switcher-single-flow)
   - 3.12 [Composition Patterns](#312-composition-patterns)
   - 3.13 [Actions Mount Through Assemble](#313-actions-mount-through-assemble)
   - 3.14 [Next Intlayer Entrypoint Contract](#314-next-intlayer-entrypoint-contract)
   - 3.15 [Next.js Routing Conventions](#315-next-js-routing-conventions)
   - 3.16 [Inline Admin Composition](#316-inline-admin-composition)
   - 3.17 [Admin Gate Contract](#317-admin-gate-contract)
4. [UI & UX](#4-ui-ux)
   - 4.1 [Token-first Styling](#41-token-first-styling)
   - 4.2 [Accessibility by Default](#42-accessibility-by-default)
5. [Intelligence](#5-intelligence)
   - 5.1 [Harness Engineering](#51-harness-engineering)
   - 5.2 [i18n: Meaning vs Data Separation](#52-i18n-meaning-vs-data-separation)
   - 5.3 [Memory Layers & Persistence](#53-memory-layers-persistence)
   - 5.4 [Decision Priority Order](#54-decision-priority-order)
   - 5.5 [Editor Role Separation](#55-editor-role-separation)
   - 5.6 [Product Core Values](#56-product-core-values)
   - 5.7 [Normative: Target over Current](#57-normative-target-over-current)
6. [Reliability](#6-reliability)
   - 6.1 [Reliability: Metadata & i18n Safety](#61-reliability-metadata-i18n-safety)
   - 6.2 [Reliability: Fault Tolerance & Isolated Boundaries](#62-reliability-fault-tolerance-isolated-boundaries)
7. [CLI](#7-cli)
   - 7.1 [Quote the Path when you Use Commands](#71-quote-the-path-when-you-use-commands)

---

## 1. Foundations <a id="1-foundations"></a>

### 1.1 Dependency Inversion <a id="11-dependency-inversion"></a>

**Impact: HIGH**

> UI と mount point から具体実装を剥がし、交換可能な境界を保つ。

## Dependency Inversion

UI や application は具体実装ではなく port に依存し、infra がそれを実装する。  
取得、保存、検証、整形を UI へ押し込まない。

**Avoid:**

```tsx
async function Component() {
  const data = await db.fetch({ id: 1 }).then((res) => schema.parse(res))
  return <div>{data.name}</div>
}
```

**Prefer:**

```tsx
export interface UserRepository {
  save(user: User): Promise<User>
}

export function makeSaveUserUseCase() {
  return new SaveUserUseCase(new PostgresUserRepository())
}
```

### 1.2 Tool Boundaries <a id="12-tool-boundaries"></a>

**Impact: HIGH**

> 道具ごとの責務を固定し、交換不可能な密結合を防ぐ。

## Tool Boundaries

それぞれの道具が担当する境界を越えない。

**Avoid:**

```text
presentation primitive に app-owned workflow や data logic を混ぜる
```

**Prefer:**

```text
Intlayer: localized meaning
shadcn/ui: base UI
src/components: presentation primitive
src/app/**/_features: app-owned feature
src/features: app tree で自然に置けない cross-branch shared
```

### 1.3 Feature Slice Structure <a id="13-feature-slice-structure"></a>

**Impact: HIGH**

> 機能単位の探索性を保ち、水平分割や早すぎる細分化を防ぐ。

## Feature Slice Structure

構造は水平レイヤーより vertical slice を優先する。  
`src/app/.../_features` を feature の基本単位とし、小さい feature は flat に保つ。

**Avoid:**

```text
src/components/FeatureA.tsx
src/hooks/useFeatureA.ts
src/types/feature-a.ts

src/app/.../_features/
  components/my-button.tsx
  lib/utils.ts
```

**Prefer:**

```text
src/app/[locale]/.../route/_features/
  feature-a.tsx
  feature-a-hooks.ts
  feature-a-types.ts

ファイル数が少ない間は _features 配下を flat に保ち、
読み筋が分かれ始めてから components/ hooks/ lib/ を掘る
```

### 1.4 Promotion By Usage <a id="14-promotion-by-usage"></a>

**Impact: HIGH**

> 再利用の事実に基づいて promote し、早すぎる抽象化を防ぐ。

## Promotion By Usage

再利用の「可能性」ではなく、実際の import 事実を基準に promote する。  
まず最も近い owner に置き、複数 owner から使われた時だけ least common owner に上げる。

**Avoid:**

```text
再利用されるかもしれない、という理由だけで最初から src/features や src/components に置く
```

**Prefer:**

```text
default promote 先は src/features ではなく src/app の ancestor owner
lint-symbol-ownership の targetOwner を promote / demote の基準に使う
```

### 1.5 Owner Placement Layers <a id="15-owner-placement-layers"></a>

**Impact: HIGH**

> 配置判断を ownership に揃え、shared の dumping ground 化を防ぐ。

## Owner Placement Layers

配置は技術分類ではなく ownership で決める。  
この repo では `src/app` の owner tree を正本とし、top-level shared は例外として扱う。

**Avoid:**

```text
app owner を持つコードを、慣性で src/features や src/components へ置く
```

**Prefer:**

```text
1. src/app/**/_features
2. ancestor owner の src/app/**/_features
3. src/components/ui
4. src/components
5. src/config, src/lib
6. src/features は app tree で自然に置けない cross-branch shared のみ
```

### 1.6 Authored Content Management <a id="16-authored-content-management"></a>

**Impact: HIGH**

> プログラム（Code）と人間が管理するデータ（Data）を物理的に分離し、デプロイなしでのコンテンツ更新を可能にする。

プログラムのソースコード（`src/`）の中に、人間が随時更新するコンテンツ定数（`*_SOURCE_ENTRIES` 等）を直接保持しない。これらは物理的に分離し、適切なストレージ層で管理する。

- **Storage Separation**: コンテンツは `storage/` 配下（`editor/*.json`, `blog/*.mdx` 等）に集約する。
- **Validation In Assemble**: データの構造は `*.assemble.ts` や frontmatter parser で厳格に定義し、読み込み時に必ず整合性を確認する。
- **Environment Transparency**: 開発時はローカルのファイルを、本番時はクラウドストレージ（Vercel Blob）を透過的に利用する。
- **Synchronicity**: クラウドとローカルのデータは、専用の同期スクリプト（`scripts/sync-storage.ts`）を介して手動で同期可能にする。

**Incorrect:**

```typescript
// src/ 配下のドメインファイルに、人間が編集するデータをハードコードする
export const MY_LINKS = [
  { name: 'X', url: 'https://x.com/...' },
  // 編集のたびに Git コミットと再デプロイが必要になる
]
```

**Correct:**

```typescript
// src/ 配下には「型」と「バリデーション」のみを置く
export type MyLink = { name: string; url: string }

// データはストレージから動的に読み込む
const { collection } = await editorRepository.loadState('links')
```

---

## 2. Security & Safety <a id="2-security-safety"></a>

### 2.1 Editor Write Safety <a id="21-editor-write-safety"></a>

**Impact: HIGH**

> editor 保存処理で path 汚染と後勝ち上書きを防ぎ、安全な write 境界を保つ。

## Editor Write Safety

editor の write path は認証、input parse、path sanitization、version check を通してから実行する。

**Avoid:**

```tsx
export async function saveAction(id: string, content: string) {
  await writeFile(`./storage/${id}.json`, content)
}
```

**Prefer:**

```tsx
export async function saveAction(unsafeId: string, content: string, expectedVersion?: string) {
  await requireEditorAdminSession()
  const id = CollectionIdSchema.parse(unsafeId)
  const safePath = join(STORAGE_DIR, `${basename(id)}.json`)
  const current = await readFile(safePath)

  if (expectedVersion && createHash(current) !== expectedVersion) {
    throw new ConflictError()
  }

  await writeFile(safePath, content)
}
```

### 2.2 Editor Session Boundary <a id="22-editor-session-boundary"></a>

**Impact: HIGH**

> editor 認証情報の owner を 1 か所に寄せ、session 検証を安定した境界として保つ。

## Editor Session Boundary

`EDITOR_ADMIN_PASSWORD` と `EDITOR_SESSION_SECRET` は editor session owner だけが扱う。  
mount point は session helper を呼ぶだけに留める。

**Avoid:**

```tsx
import { env, getRequiredEditorAdminCredentials } from "@/config/env.infra"

export async function loginEditorAdminAction(formData: FormData) {
  const { password } = getRequiredEditorAdminCredentials()
  return isValidEditorAdminPassword(input, password)
}
```

**Prefer:**

```tsx
import { verifyEditorAdminPassword, requireEditorAdminSession } from "./editor-session"

export async function loginEditorAdminAction(formData: FormData) {
  if (!verifyEditorAdminPassword(input)) return
}
```

### 2.3 Verification Guard <a id="23-verification-guard"></a>

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

### 2.4 Proxy Boundary <a id="24-proxy-boundary"></a>

**Impact: HIGH**

> `proxy.ts` を薄い入口に保ち、重い検証は server 側へ残して静的最適化と安全性を両立する。

## Proxy Boundary

Next.js 16 では `middleware.ts` ではなく `proxy.ts` を使う。  
proxy 層は情報の存在確認と付与だけに留め、重い検証や外部 I/O を持ち込まない。

**Avoid:**

```tsx
// src/middleware.ts
export function middleware() {}

export function proxy(request: NextRequest) {
  if (!verifyHmac(request.cookies.get("session"), SECRET)) {
    return NextResponse.redirect("/login")
  }
}
```

**Prefer:**

```tsx
import { intlayerProxy } from "next-intlayer/proxy"

export function proxy(request: NextRequest) {
  const response = intlayerProxy(request)
  response.headers.set("x-pathname", request.nextUrl.pathname)
  return response
}

export async function hasValidSession() {
  const h = await headers()
  const token = (await cookies()).get("session_token")
  return verifyHmac(token, SECRET)
}
```

### 2.5 Server Actions Require Auth Even For Helper Actions <a id="25-server-actions-require-auth-even-for-helper-actions"></a>

**Impact: HIGH**

> 補助用途の Server Action を無認可のまま公開すると、管理 UI 専用の機能が外部から直接実行できてしまう。

`use server` で公開された関数は、フォーム保存や本体更新だけでなく、URL メタデータ取得のような補助 action でも公開エンドポイントです。  
「editor 内からしか呼ばれない想定」は認可の代わりにならないため、admin 専用 action は最上部で必ず admin セッションを確認する必要があります。

**Incorrect:**

```tsx
'use server'

export async function fetchUrlMetadataAction(url: string) {
  const response = await fetch(url)
  return { title: await response.text() }
}
```

**Correct:**

```tsx
'use server'

import { hasEditorAdminSession } from '@/features/admin/session'

export async function fetchUrlMetadataAction(url: string) {
  if (!(await hasEditorAdminSession())) {
    return { error: 'Unauthorized' }
  }

  const response = await fetch(url)
  return { title: await response.text() }
}
```

### 2.6 Structural & Mutation Guards <a id="26-structural-mutation-guards"></a>

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

### 2.7 Security: Explicit Env Parsing & Centralization <a id="27-security-explicit-env-parsing-centralization"></a>

**Impact: CRITICAL**

> ブラウザへの機密情報の漏洩を防ぎ、すべての環境変数の型安全性を確保する。

外部ライブラリ（Vercel Blob, YouTube API 等）を呼び出す際、ライブラリ内部の暗黙的な環境変数参照（`process.env`）に頼らず、Infrastructure 層（`infra`）において `src/config/env.infra.ts` からパース済みの値を明示的に渡す。

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
// env.infra.ts で一括管理し、型安全なオブジェクトをインポートする
import { env } from "@/config/env.infra";
```

### 2.8 Security: Outbound Boundary & Zero Trust <a id="28-security-outbound-boundary-zero-trust"></a>

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

### 3.1 File Role Contract <a id="31-file-role-contract"></a>

**Impact: MEDIUM**

> `*.domain.ts` などの suffix に役割を固定し、境界の読み違いを防ぐ。

## File Role Contract

dependency inversion を読むだけで終わらせず、file suffix でも役割を固定する。

**Avoid:**

```text
UI から *.infra.ts を直接呼ぶ
1 file の中に domain, port, infra, assemble を混ぜる
```

**Prefer:**

```text
*.domain.ts: 純粋な型とドメインルール
*.port.ts: application が依存する抽象
*.infra.ts: 外部 I/O の実装
*.assemble.ts: use case 組み立てと入力整形
```

### 3.2 Separation of Logic and Presentation <a id="32-separation-of-logic-and-presentation"></a>

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

### 3.3 Editor Errors And Blog Saving Should Cross Boundaries Via Port <a id="33-editor-errors-and-blog-saving-should-cross-boundaries-via-port"></a>

**Impact: MEDIUM**

> application 層が infra 定義の例外型や特別保存処理に直接依存すると、JSON collection と blog の差分処理が infrastructure に引きずられる。

`blog` は editor collection の中でも特別で、JSON の一括保存ではなく MDX/frontmatter の保存経路を通ります。  
それでも application 層は `infra` 直参照ではなく、`port/domain` に公開された repository interface とエラー型を通して扱うのが安全です。`EditorVersionConflictError` のような UI/application が捕捉する型も `port/domain` 側に置くと境界が崩れません。

**Incorrect:**

```tsx
import {
  makeEditorRepository,
  EditorVersionConflictError,
} from '@/lib/editor/editor.assemble'

await makeEditorRepository().saveBlogPost(slug, frontmatter, body, version)
```

**Correct:**

```tsx
import { EditorVersionConflictError } from '@/lib/editor/editor.port'
import { makeSaveBlogPostUseCase } from './editor.assemble'

const saveUseCase = makeSaveBlogPostUseCase()
await saveUseCase.execute(slug, frontmatter, body, version)
```

### 3.4 Editor Collection Registration Contract <a id="34-editor-collection-registration-contract"></a>

**Impact: HIGH**

> editor collection の追加漏れは admin editor の読込と再検証を壊す

## Editor Collection Registration Contract

新しい editor collection を追加するときは、schema や UI だけで終わらせず、descriptor と registry と path mapping まで揃える。collection 追加は単一ファイル作成では完結しない。

**Incorrect:**

```tsx
// descriptor を作っただけで registry や publicPaths を更新しない
export const TOOLS_COLLECTION_DESCRIPTOR = {
  id: 'tools',
}
```

**Correct:**

```tsx
// collection 追加時は descriptor, registry, publicPaths, path mapping を揃える
export const EDITOR_COLLECTIONS = {
  tools: TOOLS_COLLECTION_DESCRIPTOR,
}
```

### 3.5 Parse At Boundaries <a id="35-parse-at-boundaries"></a>

**Impact: HIGH**

> 外部入力を未確定なまま流さず、境界で parse して内部型を確定させる。

## Parse At Boundaries

外部 API、frontmatter、URL、Server Action 入力などの boundary data は、境界で parse してから内部へ渡す。

**Avoid:**

```tsx
const data = await res.json() as UnsafeType
```

**Prefer:**

```tsx
const data = MySchema.parse(await res.json())
```

### 3.6 Apply DI Before UI Assembly <a id="36-apply-di-before-ui-assembly"></a>

**Impact: HIGH**

> UI に取得・保存・整形を抱え込ませず、leaf affordance に閉じ込める。

## Apply DI Before UI Assembly

UI assembly に入る前に dependency inversion を適用する。  
UI は leaf affordance と最小限の入力状態だけを持ち、取得・保存・整形の責務は別層へ出す。

**Avoid:**

```tsx
function LeafAdminMenu() {
  const [entries, setEntries] = useState(null)
  async function save() {
    const state = await fetch("/api/editor/notes")
    // mutate and save here
  }
}
```

**Prefer:**

```tsx
// domain / port / infra / assemble で取得と保存の責務を整理し、
// UI は leaf affordance として最小限の入力状態だけを持つ
```

### 3.7 No Dirty Code Policy <a id="37-no-dirty-code-policy"></a>

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

### 3.8 Avoid Route POST And Hard Reload For Inline Admin <a id="38-avoid-route-post-and-hard-reload-for-inline-admin"></a>

**Impact: MEDIUM**

> inline admin で route POST や `window.location.reload()` を使うと、一瞬のエラーフラッシュや体験悪化を招く。

## Avoid Route POST And Hard Reload For Inline Admin

`/links` で起きた一瞬のエラーページ表示は、client から server action を直接呼んだことで `POST /links` が発生していたのが原因だった。`window.location.reload()` も体験を悪くしていた。

**Incorrect:**

```tsx
await saveInlineEditorCollectionAction(...)
window.location.reload()
```

**Correct:**

```tsx
const result = await saveEditorCollection('links', sourceJson, version)
if (result.ok) {
  router.refresh()
}
```

### 3.9 Bundle & Discovery Hygiene <a id="39-bundle-discovery-hygiene"></a>

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

### 3.10 Performance Optimization <a id="310-performance-optimization"></a>

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

### 3.11 Locale Switcher Single Flow <a id="311-locale-switcher-single-flow"></a>

**Impact: HIGH**

> locale 永続化と遷移を二重化すると、ユーザー選択 locale が端末言語判定に負けることがある。

`next-intlayer` の `setLocale()` を使う locale 切り替えでは、同じ操作中に手動 `Link` 遷移を重ねない。切り替え処理は 1 つのフローに統一する。

### Why it matters

`setLocale()` は locale 永続化と遷移を担う。ここへ別の localized `Link` を同時に組み合わせると、端末やブラウザによっては永続化タイミングが不安定になり、次回の locale なしアクセスで `Accept-Language` が勝つことがある。

### Locale Precedence

1. URL に含まれる explicit locale
2. サイトが永続化した user-selected locale
3. `Accept-Language`
4. default locale

**Incorrect:**

```tsx
<Link href={localizedHref} onClick={() => setLocale(nextLocale)} />
```

**Correct:**

```tsx
<DropdownMenuItem
  onSelect={() => {
    startTransition(() => setLocale(nextLocale))
  }}
/>
```

`proxy.ts` 側にもこの優先順位をコメントで残し、回帰テストで固定する。

### 3.12 Composition Patterns <a id="312-composition-patterns"></a>

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

### 3.13 Actions Mount Through Assemble <a id="313-actions-mount-through-assemble"></a>

**Impact: HIGH**

> `actions.ts` を薄い mount point に保ち、infra 依存の漏出を防ぐ。

## Actions Mount Through Assemble

`src/app/.../_features/actions.ts` は Server Action の mount point であり、直接 `*.infra.ts` を呼ばない。  
入力検証は近傍の `*.assemble.ts`、認可は `session.ts`、保存や取得は use case に委譲する。

**Avoid:**

```tsx
import { makeEditorRepository } from "@/lib/editor/editor.assemble"

export async function saveBlogPostAction(formData: FormData) {
  await makeEditorRepository().saveBlogPost(slug, frontmatter, body, version)
}
```

**Prefer:**

```tsx
import { parseEditorBlogSaveInput } from "./editor-input.assemble"
import { makeSaveBlogPostUseCase } from "./editor.assemble"

export async function saveBlogPostAction(formData: FormData) {
  const parsed = parseEditorBlogSaveInput(...)
  const saveUseCase = makeSaveBlogPostUseCase()
  await saveUseCase.execute(slug, frontmatter, body, version)
}
```

### 3.14 Next Intlayer Entrypoint Contract <a id="314-next-intlayer-entrypoint-contract"></a>

**Impact: HIGH**

> route entrypoint の共通契約を外すと静的化や locale context が崩れる

## Next Intlayer Entrypoint Contract

`app/[locale]` 配下の route entrypoint は、薄いだけでなく、静的化と locale context の共通契約を満たす。新規 page や layout は既存の entrypoint パターンを踏襲する。

**Incorrect:**

```tsx
// locale 解決や provider を省略した page
export default async function Page() {
  return <MyPage />
}
```

**Correct:**

```tsx
export const dynamic = 'force-static'
export const generateMetadata = createPageMetadata('foo', {
  pathname: '/foo',
})
const FooPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <FooPageConent />
    </IntlayerServerProvider>
  )
}
export default FooPage
```

### 3.15 Next.js Routing Conventions <a id="315-next-js-routing-conventions"></a>

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

### 3.16 Inline Admin Composition <a id="316-inline-admin-composition"></a>

**Impact: HIGH**

> public UI を保ったまま admin affordance を leaf へ差し込み、page-level wrapper 化を防ぐ。

## Inline Admin Composition

inline admin は page 全体を wrapper 化せず、既存 public UI に leaf affordance を重ねる。

**Avoid:**

```tsx
export function NotesPageCollection() {
  // public list
  // admin fetch
  // save
  // edit dialog
}

<AdminGate>
  <LargeAdminAreaForWholePage />
</AdminGate>
```

**Prefer:**

```tsx
<OriginalTile />
<AdminGate>
  <TileAdminMenu />
</AdminGate>

<NoteCard>
  <AdminGate>
    <NoteAdminMenu />
  </AdminGate>
</NoteCard>
```

### 3.17 Admin Gate Contract <a id="317-admin-gate-contract"></a>

**Impact: CRITICAL**

> Admin UI の認可境界を安定させ、個別タスク都合の変更で security と hydration を壊さない。

## Admin Gate Contract

`AdminGate` は静的な公開ページへ admin UI を後載せするための基準コンポーネントとして扱う。  
個別タスクの都合で内部実装や判定戦略を変えない。

**Avoid:**

```tsx
export default async function Page() {
  const isAdmin = await checkAuth()
  return <main>{isAdmin && <Editor />}</main>
}

export function AdminGate() {
  // task を進めるためだけに new auth cache / new control flow を入れる
}
```

**Prefer:**

```tsx
export default function Page() {
  return (
    <main>
      <AdminGate>
        <DeferredAdminUI />
      </AdminGate>
      <PublicContent />
    </main>
  )
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

### 5.4 Decision Priority Order <a id="54-decision-priority-order"></a>

**Impact: HIGH**

> 複数の設計原理が衝突した際の判断基準を明確にし、一貫性を保つ。

設計判断では以下の優先順位を遵守する。

1. **Owner Tree**: `src/app` のどの owner が持つべきか
2. **Import Facts**: 実際にどの owner から参照されているか
3. **Shared Class**: primitive / config / lib / cross-branch shared のどれか
4. **Workflow & Proximity**: 一緒に直すものを近くへ置く
5. **Pattern**: components/hooks/lib 等の構文整理

**Incorrect:**

```text
// 構文の美しさ（Pattern）を優先して、機能のまとまり（Workflow）をバラバラにする
// 将来的な再利用を予想して、最初から Shared に配置する
```

**Correct:**

```text
owner tree と import facts を先に決め、その後で shared 層や構文整理を選ぶ
```

### 5.5 Editor Role Separation <a id="55-editor-role-separation"></a>

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

---

## 7. CLI <a id="7-cli"></a>

### 7.1 Quote the Path when you Use Commands <a id="71-quote-the-path-when-you-use-commands"></a>

**Impact: LOW**

> brief description of impact

bash でシンタックスエラーを出さないことを徹底する。

**Incorrect:**

```tsx
nix develop -c mv src/app/[locale]/(main)/hoge/_features/fuga.domain.ts src/lib/hoge/fuga.domain.ts
```

**Correct:**

```tsx
nix develop -c mv "src/app/[locale]/(main)/hoge/_features/fuga.domain.ts" "src/lib/hoge/fuga.domain.ts"
```

