結論：このリポジトリの DRY 違反は、単なる関数重複よりも「契約型」「分類データ」「API 呼び出し」「UI 表示単位」の重複が中心です。最優先は、共通関数を増やすことではなく、**Single Source of Truth をどの層に置くかを決めること**です。

## 1. 最優先で潰すべき DRY 違反

### A. `ProjectManifest` / `SourceManifest` の重複

`ProjectManifest` と `SourceManifest` が `src/app/page.tsx`、`src/components/Sidebar.tsx`、`src/lib/server/project-store.ts` にそれぞれ定義されています。これは将来かなり危険です。API レスポンスを少し変えた瞬間に、UI と server store の型がズレます。  

やるべきことは、`src/lib/shared/project-contract.ts` を作って、ここに集約することです。

```ts
export type SourceManifest = {
  id: string;
  name: string;
  sourcePath: string;
  createdAt: string;
};

export type ProjectManifest = {
  id: string;
  name: string;
  mainSourcePath: string;
  createdAt: string;
  updatedAt: string;
  sources: SourceManifest[];
};

export type ProjectsResponse = {
  projects: ProjectManifest[];
};

export type ProjectResponse = {
  project: ProjectManifest;
};

export type ApiErrorResponse = {
  error: string;
};
```

`project-store.ts`、`page.tsx`、`Sidebar.tsx` はこの型を import するだけにする。

これは最初にやるべきです。破壊範囲が小さく、効果が大きい。

---

### B. `rowSeedsFromRules()` が server/client で重複

`rowSeedsFromRules()` が `page.tsx` と `project-service.ts` にあります。どちらも `classificationRules` から `AssetMatrixRowSeed` を作っています。 

これは `src/lib/project/asset-matrix-seeds.ts` に寄せる。

```ts
import { classificationRules } from "../classification/classification-rules";
import type { AssetMatrixRowSeed } from "./asset-matrix-builder";

export function rowSeedsFromClassificationRules(): AssetMatrixRowSeed[] {
  return classificationRules.map((rule) => ({
    componentId: rule.componentId,
    requiredLevel: rule.requiredLevel,
    taxonomyPath: rule.path,
    groupKey: rule.path.groupId,
    kind: rule.kind,
    meaning: rule.meaning,
  }));
}
```

さらに進めるなら、`buildEmptyAssetMatrix()` も同じファイルに置く。

```ts
export function buildEmptyAssetMatrix(): AssetMatrix {
  return buildAssetMatrix({
    project: [],
    sources: [],
    rowSeeds: rowSeedsFromClassificationRules(),
  });
}
```

これで `page.tsx` は分類ルールの中身を知らなくてよくなる。

---

### C. API エラーハンドリングと JSON 変換の重複

API route 側で `try/catch`、`NextResponse.json({ error })`、`sourcePath is required` が複数箇所に出ています。`projects/route.ts`、`files/route.ts`、`sources/route.ts` で同じ形です。  

`src/lib/server/http.ts` を作る。

```ts
import { NextResponse } from "next/server";

export function errorJson(error: unknown, status = 400) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status },
  );
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }

  return value;
}
```

route はこうなる。

```ts
export async function POST(request: Request) {
  try {
    const body = await readJsonBody<CreateProjectRequest>(request);
    const sourcePath = requiredString(body.sourcePath, "sourcePath");

    const project = await createProject({
      sourcePath,
      name: body.name,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return errorJson(error);
  }
}
```

この段階で、route は「HTTP の薄い入口」だけになる。

---

## 2. 中核：分類ルールの DRY 化

`classification-rules.ts` は今後一番肥大化します。現状は各ルールで `id`、`componentId`、`requiredLevel`、`path`、`patterns`、`modes`、`kind`、`meaning`、`groupStrategy` を毎回書いています。これは読みやすい一方、増えるほど変更コストが高くなります。

ただし、ここで雑に抽象化すると逆に読みにくくなる。おすすめは「小さな DSL 化」です。

### 例：分類ルール DSL

```ts
const legacyImage = ruleDefaults({
  requiredLevel: "recommended",
  kind: "image",
  meaning: meaningForLazerLegacy(true),
});

export const stdRules = defineRules([
  legacyImage({
    id: "osu.cursor",
    path: path("std", "cursor", "cursor"),
    patterns: [
      "cursor.png",
      "cursormiddle.png",
      "cursortrail.png",
      "cursor-smoke.png",
      "cursor-ripple.png",
      "cursors/*",
    ],
    modes: ["osu"],
    groupStrategy: "fixed",
  }),

  legacyImage({
    id: "osu.hit-circles",
    path: path("std", "hit-circles", "hit-circles"),
    patterns: ["approachcircle*", "hitcircle*", "hitcircleoverlay*", "followpoint*"],
    modes: ["osu"],
    groupStrategy: "filename-stem",
  }),
]);
```

`componentId` は基本的に `id` と同じでよいので、省略可能にする。

```ts
function rule(input: RuleInput): ClassificationRule {
  return {
    componentId: input.componentId ?? input.id,
    requiredLevel: input.requiredLevel ?? "recommended",
    groupStrategy: input.groupStrategy ?? "fixed",
    ...input,
  };
}
```

これで「明示性」は残しつつ、毎回同じノイズを書く必要がなくなる。

---

## 3. Taxonomy と Classification Rules の二重管理を減らす

`taxonomy.ts` は scope/category/group のラベル・順序を持っています。一方で `classification-rules.ts` も `path.scopeId/categoryId/groupId` を大量に持っています。 

これは完全には消せません。なぜなら taxonomy は「表示構造」、classification rules は「ファイル名をどう分類するか」だからです。

ただし、`path` の記述は短縮できます。

```ts
path("std", "hit-circles", "hit-circles")
```

さらに型安全にするなら、taxonomy から category/group の型を導出する。

理想形はこれです。

```ts
rule({
  id: "mania.notes",
  path: t.mania.notes.notes,
  patterns: ["mania-note*"],
  modes: ["mania"],
});
```

つまり `taxonomyDefinition` から `t.std.slider["slider-miss-indicators"]` のような path helper を生成する。

手書きで十分ならこう。

```ts
export const t = {
  std: {
    hitCircles: {
      hitCircles: path("std", "hit-circles", "hit-circles"),
      approachCircle: path("std", "hit-circles", "approach-circle"),
    },
    slider: {
      slider: path("std", "slider", "slider"),
      missIndicators: path("std", "slider", "slider-miss-indicators"),
    },
  },
} as const;
```

分類ルールの `path` が文字列ベタ書きから意味名に変わるので、typo に強くなります。

---

## 4. `humanizeIdentifier` と `titleizeIdentifier` の統合

`taxonomy.ts` に `humanizeIdentifier`、`filename-normalizer.ts` に `titleizeIdentifier` があり、どちらも識別子を表示名に変換しています。`std`、`osu`、`taiko`、`mania`、`ui`、`json`、`hd` などの override も似ています。 

これは `src/lib/domain/label.ts` に統合する。

```ts
export const labelOverrides: Record<string, string> = {
  std: "osu!standard",
  osu: "osu!",
  taiko: "osu!taiko",
  catch: "osu!catch",
  mania: "osu!mania",
  ui: "UI",
  hud: "HUD",
  json: "JSON",
  ini: "INI",
  pp: "PP",
  rpm: "RPM",
  sd: "SD",
  hd: "HD",
  kiai: "Kiai",
};

export function humanizeIdentifier(value: string): string {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_/]+/g, "-")
    .toLowerCase();

  if (labelOverrides[normalized]) return labelOverrides[normalized];

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => labelOverrides[part] ?? part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
```

`taxonomy.ts` と `filename-normalizer.ts` はこれを使うだけにする。

---

## 5. UI 側は「画面」ではなく「表示部品」で DRY 化する

`Sidebar` と `Page` のメイン領域で、scope/category の tab 表示が重複しています。`Sidebar` では縦リスト、`Page` では横タブですが、データ構造と active 判定は同じです。 

作るべき部品はこれです。

```text
src/components/ui/TabList.tsx
src/components/ui/Field.tsx
src/components/ui/Panel.tsx
src/components/ui/Badge.tsx
src/components/project/ProjectSelector.tsx
src/components/project/SkinPathForm.tsx
src/components/assets/AssetRow.tsx
src/components/assets/AssetPreview.tsx
```

特に `AssetRow` と `AssetPreview` は `EditView.tsx` から外に出す価値があります。`EditView` 内に、表示、filter、preview、empty cell、source cell selection が混在しています。

`EditView` は最終的にこういう薄さにしたい。

```tsx
export function EditView(props: Props) {
  const rows = useVisibleAssetRows(props);

  return (
    <AssetCompareLayout
      tools={<AssetCompareTools {...props} />}
      rows={rows}
      renderRow={(row) => <AssetPairRow row={row} />}
    />
  );
}
```

---

## 6. API client を作って `fetch` 直書きを消す

`page.tsx` は `fetch("/api/projects")`、`fetch("/api/projects/:id/files")`、`fetch("/api/projects/:id/sources")` を直接持っています。`readJson<T>()` も page 内にあります。

`src/lib/client/project-api.ts` に寄せる。

```ts
export async function listProjects(): Promise<ProjectManifest[]> {
  const data = await readJson<ProjectsResponse>(await fetch("/api/projects"));
  return data.projects;
}

export async function createProject(input: CreateProjectRequest): Promise<ProjectManifest> {
  const data = await readJson<ProjectResponse>(
    await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );

  return data.project;
}

export async function getProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  return readJson<ProjectFilesResponse>(
    await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`),
  );
}
```

`Page` は「状態遷移」だけを持つ。

---

## 7. README と実装のズレも DRY 違反として扱う

README は Repository Layout に `src/domain/`、`src/classification/`、`src/project/`、`src/editor/`、`skin-lib.ts` などを書いていますが、実装側は `src/lib/domain`、`src/lib/classification`、`src/lib/project`、Next App Router 構成になっています。さらに `package.json` の scripts は `dev/build/start/test/typecheck/check` で、README にある `npm run build:editor` とはズレがあります。 

これは「ドキュメントが実装構造を手書きで複製している」ために起きています。

対策はどちらか。

1つ目は README の Repository Layout を削る。代わりに `docs/architecture.md` に移す。

2つ目は `scripts/print-repo-layout.ts` のような生成スクリプトを作り、README に貼る内容を生成する。

現実的には前者でよいです。

---

## 推奨リファクタ順序

### Phase 1：型契約の集約

作るファイル。

```text
src/lib/shared/project-contract.ts
src/lib/shared/api-contract.ts
```

移動対象。

```text
ProjectManifest
SourceManifest
ProjectFilesResponse
ApiErrorResponse
CreateProjectRequest
AddProjectSourceRequest
```

最初にこれをやる。影響範囲が明確で、壊れても TypeScript が検出しやすい。

---

### Phase 2：API client / server HTTP helper

作るファイル。

```text
src/lib/client/api.ts
src/lib/client/project-api.ts
src/lib/server/http.ts
```

消すもの。

```text
page.tsx 内の readJson
route.ts ごとの errorJson
route.ts ごとの request body 型ベタ書き
```

---

### Phase 3：分類ルール DSL

作るファイル。

```text
src/lib/classification/rule-dsl.ts
src/lib/classification/rules/std.rules.ts
src/lib/classification/rules/taiko.rules.ts
src/lib/classification/rules/catch.rules.ts
src/lib/classification/rules/mania.rules.ts
src/lib/classification/rules/interface.rules.ts
src/lib/classification/rules/fonts.rules.ts
src/lib/classification/rules/sounds.rules.ts
src/lib/classification/rules/stable.rules.ts
```

`classification-rules.ts` は aggregator にする。

```ts
export const classificationRules = defineRules([
  ...configRules,
  ...interfaceRules,
  ...fontRules,
  ...stdRules,
  ...taikoRules,
  ...catchRules,
  ...maniaRules,
  ...soundRules,
  ...stableRules,
]);
```

---

### Phase 4：UI primitives

作るファイル。

```text
src/components/ui/TabList.tsx
src/components/ui/Field.tsx
src/components/ui/Badge.tsx
src/components/ui/EmptyState.tsx
src/components/assets/AssetPreview.tsx
src/components/assets/AssetRow.tsx
src/components/assets/AssetPairRow.tsx
```

`EditView.tsx` と `Sidebar.tsx` から JSX の重複を削る。

---

### Phase 5：README の責務縮小

README は使い方だけにする。

```text
README.md
  - What is this
  - Quick Start
  - Main workflow
  - Commands
  - Links to docs
```

構造説明は別ファイル。

```text
docs/architecture.md
docs/classification-model.md
docs/project-storage.md
```

---

## 最終的な設計方針

このプロジェクトでは、DRY の軸をこう分けるとよいです。

```text
1. Contract DRY
   型・API レスポンス・manifest schema を一箇所に置く

2. Data DRY
   taxonomy / classification rules / mode definitions を二重管理しない

3. Flow DRY
   API route の try/catch, JSON, validation を共通化する

4. View DRY
   Tab, Field, Badge, AssetPreview, AssetRow を部品化する

5. Documentation DRY
   README に実装構造を複製しすぎない
```

最初の一手はこれでいいです。

```text
src/lib/shared/project-contract.ts
src/lib/project/asset-matrix-seeds.ts
src/lib/server/http.ts
src/lib/client/project-api.ts
```

この4つを作るだけで、型重複、row seed 重複、fetch 重複、route エラー処理重複がかなり減ります。Classification DSL は効果が大きいですが、分類仕様がまだ揺れているなら Phase 2 以降でよいです。
