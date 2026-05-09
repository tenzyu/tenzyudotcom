## 1. God Client Component smell

`src/app/page.tsx` がやりすぎです。

ここに同居している責務は、少なくともこれだけあります。

```text
画面状態管理
API client
API error handling
Project selection
Import main skin
Add asset source
scope/category 集計
active scope/category の補正
empty matrix 生成
SSR hydration 回避
Edit / Preview view switching
```

`Page` が `classificationRules` と `buildAssetMatrix` を直接 import して、UI entry point なのに分類ルールと matrix 生成の事情まで知っています。これは「画面」が「domain/application の組み立て」を知りすぎている状態です。

Status: in progress. Root page is now thin, and workspace state has been moved into hooks.

対策は、`Page` を薄くすること。

```text
src/hooks/useProjects.ts
src/hooks/useAssetMatrixNavigation.ts
src/lib/client/project-api.ts
src/lib/project/empty-matrix.ts
```

`Page` は最終的に「hook から値を受けて JSX に流すだけ」に寄せる。

---

## 2. Boundary leakage smell

client が domain rules を直接知っています。

`page.tsx` は `classificationRules` から row seed を作り、`project-service.ts` も同じく server 側で row seed を作っています。これは DRY でもありますが、より本質的には **client / server / domain の境界が混ざっている** smell です。 

本来、client は「分類ルール」を知らなくていい。client が欲しいのは `AssetMatrix` か `NavigationModel` です。

理想はこうです。

```text
server:
  classificationRules
  ClassifiedSkinAsset
  AssetMatrix build

client:
  ProjectFilesResponse.matrix
  AssetMatrixNavigation
  render only
```

空状態のためだけに client が `classificationRules` を import しているなら、server が `/api/classification/matrix-template` を返すか、client には軽量な `matrixSkeleton` だけを持たせる方が境界が綺麗です。

---

## 3. Hydration avoidance smell

`page.tsx` は `mounted` state を使って、mount 前は `InitialShell` を返しています。

これは hydration mismatch 回避としては有効ですが、smell でもあります。

なぜなら、本質的には「SSR できる shell」と「client only な状態」を分けるべきところを、ページ全体で client mount gate しているからです。

今後の方向性はこれです。

```text
Server Component:
  layout shell
  static title
  non-interactive placeholder

Client Component:
  ProjectWorkspace
  Sidebar state
  EditView state
```

`"use client"` を page 全体に置くより、`ProjectWorkspaceClient` に閉じ込める方がよいです。

---

## 4. Magic string / taxonomy coupling smell

`std`、`taiko`、`catch`、`mania`、`stable`、`sounds`、`hit-circles`、`slider` などが taxonomy、classification rules、preview tabs、UI state に散っています。`PreviewView` も独自の `PreviewTab` を持っています。 

これは将来、scope 名を変えたときに壊れます。

Status: partially done. Preview tabs are now derived from the current matrix scopes, and `audio` was renamed to `sounds`.

対策は、scope/tab 定義を taxonomy から導出すること。

```ts
const previewTabs = [
  { id: "overview", label: "Overview", kind: "virtual" },
  { id: "std", label: scopeLabel("std"), kind: "scope" },
  { id: "taiko", label: scopeLabel("taiko"), kind: "scope" },
  { id: "catch", label: scopeLabel("catch"), kind: "scope" },
  { id: "mania", label: scopeLabel("mania"), kind: "scope" },
  { id: "sounds", label: scopeLabel("sounds"), kind: "scope" },
  { id: "stable", label: scopeLabel("stable"), kind: "scope" },
] as const;
```

`audio` という tab 名と `sounds` という scope 名がズレているのも小さな smell です。表記揺れが起きます。

---

## 5. Algorithm duplication / policy duplication smell

`AssetMatrixBuilder` と `AssetTreeBuilder` に似た policy が分散しています。

例えば、`mergeMeaning`、`preferKind`、node / row の sort policy、`lazerMeaningful` の集約などです。 

これは DRY でもありますが、より正確には **domain policy の重複** です。

`meaning` をどう merge するか、`kind` の優先順位をどう決めるかは domain rule です。builder ごとに持つべきではありません。

Status: done. Shared policy now lives in `src/lib/domain/skin-asset-policy.ts`.

切り出し先はここ。

```text
src/lib/domain/skin-asset-policy.ts
```

中身はこういうもの。

```ts
export function mergeSkinMeaning(a: SkinMeaning, b: SkinMeaning): SkinMeaning;
export function preferSkinKind(a: SkinKind | "empty", b: SkinKind): SkinKind;
export function compareAssetTaxonomyOrder(a: TaxonomyPath, b: TaxonomyPath): number;
```

---

## 6. Temporal ID collision smell

`timestampId(prefix)` は ISO string から数字だけを取り、秒単位で ID を作っています。

```ts
return `${prefix}-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
```

同じ prefix の source を同じ秒に追加すると衝突し得ます。人間操作なら低確率ですが、テストや bulk import では普通に起きます。

対策は `crypto.randomUUID()` か、timestamp + random suffix。

```ts
export function newEntityId(prefix: string): string {
  return `${slugify(prefix)}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}
```

---

## 7. CSS monolith smell

`styles.css` がかなり大きく、現在の最小 UI に対して modal、pane、groupCard、toast、conflict、exportResult など将来機能・旧機能らしき class が多いです。

これは「CSS がアプリ履歴の墓場」になり始めています。

対策はコンポーネント境界で分けること。

Tailwind を入れます。

---

## 8. `unknown` で契約を逃がしている smell

`page.tsx` の `ProjectFilesResponse` で `projectTree: unknown`、source の `tree: unknown` になっています。

server 側には `ReturnType<typeof buildAssetTree>` として型があります。

これは「型を共有できていないから client で unknown にしている」状態です。

`AssetTree` はすでに `asset-tree-builder.ts` に export されているので、client 側でもそれを import すればよいです。

---

## 9. File-system full path leakage smell

`ClassifiedSkinAsset` は `SkinFileRef` を持ち、`root`、`relativePath`、`fullPath` を含みます。

`getProjectFiles()` は `ClassifiedSkinAsset[]` をそのまま API response に返しています。

ローカル専用なら問題は小さいですが、UI に必要なのは多くの場合 `relativePath`、`name`、`extension`、asset id くらいです。`fullPath` を client に渡す必要があるかは再検討した方がいい。

対策。

Status: done for HTTP responses. `asset-dto.ts` now sanitizes `root` and `fullPath` before project file responses leave server services.

```text
Domain model:
  ClassifiedSkinAsset

API DTO:
  SkinAssetDto
```

domain object をそのまま API で返さない。

---

```text
P0
- ProjectManifest / API contract の集約

P1
- client が classificationRules を直接 import している境界漏れ
- unknown response 型
- AssetMatrix / AssetTree の domain policy 重複

P2
- CSS monolith
- magic string taxonomy coupling
- timestampId collision
- mounted gate の縮小

Additional status:
- Temporal source/project IDs now use timestamp plus random suffix.
- Turbopack filesystem trace warning was removed by scoping `process.cwd()` usage with `turbopackIgnore`.
- Browser-facing asset responses sanitize server-only `root` and `fullPath`.
```
