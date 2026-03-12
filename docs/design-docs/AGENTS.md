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
   - 1.3 [Authored Content Management](#13-authored-content-management)
   - 1.4 [Feature Slice Structure](#14-feature-slice-structure)
   - 1.5 [Promotion By Usage](#15-promotion-by-usage)
   - 1.6 [Owner Placement Layers](#16-owner-placement-layers)
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
   - 3.2 [Editor Collection Registration](#32-editor-collection-registration)
   - 3.3 [Editor Errors And Blog Saving Should Cross Boundaries Via Port](#33-editor-errors-and-blog-saving-should-cross-boundaries-via-port)
   - 3.4 [Parse At Boundaries](#34-parse-at-boundaries)
   - 3.5 [Apply DI Before UI Assembly](#35-apply-di-before-ui-assembly)
   - 3.6 [Avoid Route POST And Hard Reload For Inline Admin](#36-avoid-route-post-and-hard-reload-for-inline-admin)
   - 3.7 [Actions Mount Through Assemble](#37-actions-mount-through-assemble)
   - 3.8 [Bundle Hygiene](#38-bundle-hygiene)
   - 3.9 [Route Entrypoint Contracts](#39-route-entrypoint-contracts)
   - 3.10 [Component Separation](#310-component-separation)
   - 3.11 [Inline Admin Composition](#311-inline-admin-composition)
   - 3.12 [Admin Gate Contract](#312-admin-gate-contract)
4. [UI & UX](#4-ui-ux)
   - 4.1 [Token-first Styling](#41-token-first-styling)
   - 4.2 [Locale Switcher Single Flow](#42-locale-switcher-single-flow)
   - 4.3 [Performance Optimization](#43-performance-optimization)
   - 4.4 [Accessibility by Default](#44-accessibility-by-default)
   - 4.5 [Composition Patterns](#45-composition-patterns)
5. [Intelligence](#5-intelligence)
   - 5.1 [Harness Memory Model](#51-harness-memory-model)
   - 5.2 [Meaning Vs Data Separation](#52-meaning-vs-data-separation)
   - 5.3 [Content Role Separation](#53-content-role-separation)
   - 5.4 [Decision Policy](#54-decision-policy)
   - 5.5 [Product Core Values](#55-product-core-values)
6. [Reliability](#6-reliability)
   - 6.1 [Reliability: Metadata & i18n Safety](#61-reliability-metadata-i18n-safety)
   - 6.2 [Reliability: Fault Tolerance & Isolated Boundaries](#62-reliability-fault-tolerance-isolated-boundaries)
7. [CLI](#7-cli)
   - 7.1 [Quote Path Commands](#71-quote-path-commands)

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

### 1.3 Authored Content Management <a id="13-authored-content-management"></a>

**Impact: HIGH**

> code と人間が管理する content data を分離し、更新を deploy 依存にしない。

## Authored Content Management

人間が随時更新する content は `src/` に埋め込まず、storage 層で管理する。  
`src/` には型、validation、assemble だけを置く。

**Avoid:**

```typescript
export const MY_LINKS = [
  { name: "X", url: "https://x.com/..." },
]
```

**Prefer:**

```typescript
export type MyLink = { name: string; url: string }

const { collection } = await editorRepository.loadState("links")
```

### 1.4 Feature Slice Structure <a id="14-feature-slice-structure"></a>

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

### 1.5 Promotion By Usage <a id="15-promotion-by-usage"></a>

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

### 1.6 Owner Placement Layers <a id="16-owner-placement-layers"></a>

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

**Avoid:**

```text
// 「コードを書いたので完了です」と報告し、一度もビルドやテストを走らせない
// エラーが出ているが「手元の環境では動く」として無視する
```

**Prefer:**

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

**Avoid:**

```tsx
'use server'

export async function fetchUrlMetadataAction(url: string) {
  const response = await fetch(url)
  return { title: await response.text() }
}
```

**Prefer:**

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

**Avoid:**

```tsx
// 複数のファイルで process.env を直接呼び出し、型も不明
const apiKey = process.env.API_KEY;
```

**Prefer:**

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

**Avoid:**

```tsx
// 入力をそのまま DB 操作等に使用する
export async function myAction(id: string) {
  return await db.update(id, ...);
}
```

**Prefer:**

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

### 3.2 Editor Collection Registration <a id="32-editor-collection-registration"></a>

**Impact: HIGH**

> editor collection 追加時の registry 漏れを防ぎ、admin editor の読込経路を壊さない。

## Editor Collection Registration

新しい editor collection を追加するときは、descriptor だけで終わらせず registry と path mapping まで揃える。

**Avoid:**

```tsx
export const TOOLS_COLLECTION_DESCRIPTOR = {
  id: "tools",
}
```

**Prefer:**

```tsx
export const EDITOR_COLLECTIONS = {
  tools: TOOLS_COLLECTION_DESCRIPTOR,
}
```

### 3.3 Editor Errors And Blog Saving Should Cross Boundaries Via Port <a id="33-editor-errors-and-blog-saving-should-cross-boundaries-via-port"></a>

**Impact: MEDIUM**

> application 層が infra 定義の例外型や特別保存処理に直接依存すると、JSON collection と blog の差分処理が infrastructure に引きずられる。

`blog` は editor collection の中でも特別で、JSON の一括保存ではなく MDX/frontmatter の保存経路を通ります。  
それでも application 層は `infra` 直参照ではなく、`port/domain` に公開された repository interface とエラー型を通して扱うのが安全です。`EditorVersionConflictError` のような UI/application が捕捉する型も `port/domain` 側に置くと境界が崩れません。

**Avoid:**

```tsx
import {
  makeEditorRepository,
  EditorVersionConflictError,
} from '@/lib/editor/editor.assemble'

await makeEditorRepository().saveBlogPost(slug, frontmatter, body, version)
```

**Prefer:**

```tsx
import { EditorVersionConflictError } from '@/lib/editor/editor.port'
import { makeSaveBlogPostUseCase } from './editor.assemble'

const saveUseCase = makeSaveBlogPostUseCase()
await saveUseCase.execute(slug, frontmatter, body, version)
```

### 3.4 Parse At Boundaries <a id="34-parse-at-boundaries"></a>

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

### 3.5 Apply DI Before UI Assembly <a id="35-apply-di-before-ui-assembly"></a>

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

### 3.6 Avoid Route POST And Hard Reload For Inline Admin <a id="36-avoid-route-post-and-hard-reload-for-inline-admin"></a>

**Impact: MEDIUM**

> inline admin で route POST や `window.location.reload()` を使うと、一瞬のエラーフラッシュや体験悪化を招く。

## Avoid Route POST And Hard Reload For Inline Admin

`/links` で起きた一瞬のエラーページ表示は、client から server action を直接呼んだことで `POST /links` が発生していたのが原因だった。`window.location.reload()` も体験を悪くしていた。

**Avoid:**

```tsx
await saveInlineEditorCollectionAction(...)
window.location.reload()
```

**Prefer:**

```tsx
const result = await saveEditorCollection('links', sourceJson, version)
if (result.ok) {
  router.refresh()
}
```

### 3.7 Actions Mount Through Assemble <a id="37-actions-mount-through-assemble"></a>

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

### 3.8 Bundle Hygiene <a id="38-bundle-hygiene"></a>

**Impact: HIGH**

> バンドルサイズの肥大化を防ぎ、import 経路の ownership を明示する。

## Bundle Hygiene

内部コードの barrel import は原則禁止とし、必要な source file を直接 import する。

**Avoid:**

```typescript
import { a, b, c } from "@/features/notes"
```

**Prefer:**

```typescript
import { a } from "@/features/notes/components/a"
```

### 3.9 Route Entrypoint Contracts <a id="39-route-entrypoint-contracts"></a>

**Impact: HIGH**

> route entrypoint を薄く保ち、locale/static 化の共通契約を外さないようにする。

## Route Entrypoint Contracts

`page.tsx`, `layout.tsx`, `route.ts` などの entrypoint は、フレームワーク接続と route 固有契約だけを持つ。  
`app/[locale]` 配下では locale 解決と static 化の共通契約も外さない。

**Avoid:**

```tsx
export default async function Page({ params }) {
  const data = await fetchData(params.id)
  const metadata = { title: data.name }
  return <div>{data.items.map((i) => <Item i={i} />)}</div>
}
```

**Prefer:**

```tsx
export const dynamic = "force-static"
export const generateMetadata = createPageMetadata("foo", {
  pathname: "/foo",
})

const FooPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  return (
    <IntlayerServerProvider locale={locale}>
      <FooPageContent />
    </IntlayerServerProvider>
  )
}
```

### 3.10 Component Separation <a id="310-component-separation"></a>

**Impact: HIGH**

> dirty component を放置せず、logic と presentation を分けて保守性を守る。

## Component Separation

1 file に副作用、取得、DOM 監視、見た目を混ぜた dirty component を許容しない。  
logic は hook や helper へ出し、presentation は見た目に専念させる。

**Avoid:**

```tsx
export default function DirtyComponent() {
  const [state, setState] = useState(0)
  useEffect(() => { /* complex DOM watch */ }, [])
  return <div style={{ color: "red" }}>{state}</div>
}
```

**Prefer:**

```tsx
export default function CleanComponent() {
  const { data } = useResource()
  return <PresentationalView data={data} />
}
```

### 3.11 Inline Admin Composition <a id="311-inline-admin-composition"></a>

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

### 3.12 Admin Gate Contract <a id="312-admin-gate-contract"></a>

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

**Avoid:**

```tsx
// マジックナンバーやハードコードされた色
<div style={{ padding: '13px', color: '#ff0000' }}>
```

**Prefer:**

```tsx
// トークン（Tailwind クラス）を使用
<div className="p-3 text-destructive">
```

### 4.2 Locale Switcher Single Flow <a id="42-locale-switcher-single-flow"></a>

**Impact: HIGH**

> locale 永続化と遷移を二重化すると、ユーザー選択 locale が端末言語判定に負けることがある。

## Locale Switcher Single Flow

`next-intlayer` の `setLocale()` を使う locale 切り替えでは、同じ操作中に手動 `Link` 遷移を重ねない。  
切り替え処理は 1 つのフローに統一する。

**Avoid:**

```tsx
<Link href={localizedHref} onClick={() => setLocale(nextLocale)} />
```

**Prefer:**

```tsx
<DropdownMenuItem
  onSelect={() => {
    startTransition(() => setLocale(nextLocale))
  }}
/>
```

### 4.3 Performance Optimization <a id="43-performance-optimization"></a>

**Impact: HIGH**

> 初期ロードの高速化と、インタラクションの応答性を限界まで高める。

## Performance Optimization

ウォーターフォール、過大バンドル、不要な再レンダリングを抑える。

**Avoid:**

```tsx
const a = await getA()
const b = await getB()
```

**Prefer:**

```tsx
const [a, b] = await Promise.all([getA(), getB()])
```

### 4.4 Accessibility by Default <a id="44-accessibility-by-default"></a>

**Impact: MEDIUM**

> 全てのユーザーが利用可能で、かつ検証しやすい UI 構造を維持する。

Semantic HTML を遵守し、WAI-ARIA ガイドラインに従う。見た目のためだけの `div` 多用を避け、スクリーンリーダーやキーボード操作に対応させる。

- **Semantic Elements**: `header`, `nav`, `main`, `article`, `section`, `footer` を適切に使い分ける。
- **Unique IDs**: インタラクティブ要素にはブラウザテストのための説明的な ID を付与する。

**Avoid:**

```tsx
// 意味のない div の羅列。ボタンなのにクリックイベントを div に付ける
<div onClick={...}>Click me</div>
```

**Prefer:**

```tsx
// セマンティックな HTML。ボタン要素を使い、アクセシビリティを確保
<button id="submit-button" onClick={...}>Submit</button>
```

### 4.5 Composition Patterns <a id="45-composition-patterns"></a>

**Impact: HIGH**

> プロップ・ドリリングを抑制し、RSC ペイロードを最小化することで、保守性とパフォーマンスを向上させる。

## Composition Patterns

トップレベルからの prop drilling を避け、`children` などの composition で責務を分ける。  
Server Components で取得したデータは、Client Components へ最小限だけ渡す。

**Avoid:**

```tsx
<ClientParent data={hugeData} />
```

**Prefer:**

```tsx
<ClientParent>
  <ServerChild data={neededPart} />
</ClientParent>
```

---

## 5. Intelligence <a id="5-intelligence"></a>

### 5.1 Harness Memory Model <a id="51-harness-memory-model"></a>

**Impact: HIGH**

> ハーネス更新と知識保存先の判断を一体で定義し、暗黙知とコンテキスト汚染を防ぐ。

## Harness Memory Model

ハーネスはコード変更と同時に保守し、情報の性質ごとに保存先を分ける。

**Avoid:**

```text
ドキュメントを更新せずにアーキテクチャを変える
恒久的なルールを一時的な TODO や会話ログに閉じ込める
過去の失敗を永続化せず同じ実装ミスを繰り返す
```

**Prefer:**

```text
session: 作業中のみ
repo/structural: AGENTS.md や構造そのもの
durable: design-docs と exec-plans/completed

構造変更時は docs/design-docs/*.md も更新する
複雑な判断の経緯は docs/exec-plans/completed/ に残す
```

### 5.2 Meaning Vs Data Separation <a id="52-meaning-vs-data-separation"></a>

**Impact: HIGH**

> 識別子と翻訳文を分離し、データ更新と多言語化を疎結合にする。

## Meaning Vs Data Separation

国際化はテキスト置換ではなく、identifier と visible meaning の分離として扱う。

**Avoid:**

```typescript
export const content = {
  linkUrl: "https://example.com/id-123",
  linkLabel: "Click here",
}
```

**Prefer:**

```typescript
// item.source.ts -> { id, url }
// item.content.ts -> { label }
// *.assemble.ts -> source と content を結合
```

### 5.3 Content Role Separation <a id="53-content-role-separation"></a>

**Impact: MEDIUM**

> 文言の役割を分離し、SEO と UX の両方で適切な粒度を保つ。

## Content Role Separation

文言は metadata、header、lead、nav で同じものを使い回さない。  
露出場所ごとに役割を分ける。

**Avoid:**

```text
metadata description を page lead としてそのまま再利用する
nav label に長い説明文を流し込む
```

**Prefer:**

```text
metadata: 検索・共有用
header: 訪問者への導入
lead: ページ内容の短い説明
nav/tile: 行き先判断のための短いラベル
```

### 5.4 Decision Policy <a id="54-decision-policy"></a>

**Impact: HIGH**

> 優先順位と target architecture を同時に固定し、現状追認による判断ブレを防ぐ。

## Decision Policy

設計判断は current code の追認ではなく、target architecture に寄せる前提で行う。  
そのうえで優先順位は owner tree から順に見る。

**Avoid:**

```text
既存の悪い前例に合わせて target のほうを書き換える
構文の美しさを優先して owner tree や import facts を崩す
将来の再利用を予想して最初から shared に置く
```

**Prefer:**

```text
現状のズレは負債として扱う
一度で直し切れなくても変更のたびに target へ寄せる

1. owner tree
2. import facts
3. shared class
4. workflow and proximity
5. pattern
```

### 5.5 Product Core Values <a id="55-product-core-values"></a>

**Impact: MEDIUM**

> サイトの長期的価値を保護し、不要な機能の肥大化を防ぐ。

このサイトは「Durable Memory（永続的な記憶）」と「Living Curation（生きたキュレーション）」のための「庭（Garden）」である。

- **Owned Identity**: 制作物と文体を自分のドメインに集約する。
- **Utility for Self**: 自分自身が毎日使うための道具（Pointers等）を持つ。
- **Lightweight Admin**: 更新の摩擦を極限まで減らし、継続性を重視する。

**Avoid:**

```text
// 自分では使わない、単なる見栄えのための複雑な機能を追加する
// 更新が面倒な重厚な CMS 機能を導入し、更新が途絶える
```

**Prefer:**

```text
// 自分が毎日開きたくなるような便利なダッシュボード機能を優先する
// スマホからでも 1 分でリンクを追加できる軽量な仕組みを維持する
```

---

## 6. Reliability <a id="6-reliability"></a>

### 6.1 Reliability: Metadata & i18n Safety <a id="61-reliability-metadata-i18n-safety"></a>

**Impact: HIGH**

> 検索エンジンのインデックスや、各ロケールでの SEO 情報を確実に生成・反映させる。

`sitemap.ts` や `robots.ts` 等の重要なメタデータを生成する際、不確かなロケール推論やリクエストヘッダー（Host 等）に頼らず、確定された単一の環境変数（`SITE_URL` 等）から絶対パスを出力する。

- **i18n Metadata**: すべてのサポートロケールリストを明示的にループし、`alternates` 等がすべての言語間で漏れなく生成されることをビルド時または実行時に保証する。

**Avoid:**

```tsx
// 相対パスや Host ヘッダーに依存した URL 生成
const url = `https://${headers().get('host')}/sitemap.xml`;
```

**Prefer:**

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

**Avoid:**

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

**Prefer:**

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

### 7.1 Quote Path Commands <a id="71-quote-path-commands"></a>

**Impact: LOW**

> shell command で path 展開やシンタックスエラーを起こさない。

## Quote Path Commands

shell で path を渡すときは quote する。

**Avoid:**

```bash
nix develop -c mv src/app/[locale]/(main)/hoge/_features/fuga.domain.ts src/lib/hoge/fuga.domain.ts
```

**Prefer:**

```bash
nix develop -c mv "src/app/[locale]/(main)/hoge/_features/fuga.domain.ts" "src/lib/hoge/fuga.domain.ts"
```


---

## Repair References

Use these short guides when a linter points you at a specific repair path.

- [Import Boundaries Repair Guide](./references/import-boundaries.md)
- [No Re-export Repair Guide](./references/no-reexport.md)
- [Site Rules Repair Guide](./references/site-rules.md)
- [Symbol Ownership Repair Guide](./references/symbol-ownership.md)
