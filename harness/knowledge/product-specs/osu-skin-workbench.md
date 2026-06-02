---
name: osu-skin-workbench
description: osu! skin workbench の確定仕様と未決事項を分離した製品仕様ノート。
---

# osu-skin-workbench Spec v0.1

## References
- `product/apps/osu-skin-workbench/README.md`
- `product/apps/osu-skin-workbench/src/App.tsx:7`
- `product/apps/osu-skin-workbench/src/components/ProjectHubClient.tsx:61`
- `product/apps/osu-skin-workbench/src/components/ProjectWorkspaceClient.tsx:30`
- `product/apps/osu-skin-workbench/src/components/Sidebar.tsx:49`
- `product/apps/osu-skin-workbench/src/components/EditView.tsx:47`
- `product/apps/osu-skin-workbench/src/components/PreviewView.tsx:15`
- `product/apps/osu-skin-workbench/src-tauri/src/commands/project.rs:40`
- `product/apps/osu-skin-workbench/src-tauri/src/commands/assets.rs:55`
- `product/apps/osu-skin-workbench/src-tauri/src/commands/export.rs:10`
- `product/packages/osu-skin-core/src/lib/domain/taxonomy.ts:98`
- `product/packages/osu-skin-core/src/lib/project/asset-matrix-builder.ts:252`
- `product/packages/osu-skin-core/src/lib/project/asset-row-filter.ts:15`
- `product/packages/osu-skin-core/src/lib/shared/project-contract.ts:16`

## Goal

`osu-skin-workbench` は、`.osk` または extracted skin folder を local workspace として取り込み、`@tenzyu/osu-skin-core` によって skin.ini と assets を分類・ツリー化・マトリクス化し、Tauri/Rust backend 経由で安全に preview/edit/export できる desktop-first な osu! skin workbench である。

## Confirmed specification

### Product identity

- Next.js の主戦場ではなく、Tauri + Vite + React の desktop app である。
- 旧称として `osu-skin-editor` 的な表現はあり得るが、この repo では `osu-skin-workbench` が正しい呼称である。
- 単なる editor ではなく、解析・分類・検証・比較・プレビュー・export を含む workbench である。

### Core workflow

- ユーザーは project を作成・選択できる。
- project は `.osk` ファイルまたは extracted skin folder から import できる。
- main skin に対して asset source を追加できる。
- project を edit / preview の2 view で扱える。
- project を rebuild できる。
- `.osk` / diff / backup を export できる。

### UI structure

- Hub 画面で project 一覧、作成、rename、delete を扱う。
- Workspace 画面で Edit / Preview を切り替える。
- Sidebar で project import、asset source 追加、scope/category navigation、source list を扱う。
- Edit view では project ⇄ source の compare matrix を表示する。
- Preview view ではカテゴリ単位の mock preview と validation summary を表示する。

### Data model

- project は `ProjectManifest` を持つ。
- project file fetch は `ProjectFilesResponse` / desktop variant に相当する contract を使う。
- taxonomy は `@tenzyu/osu-skin-core` にあり、少なくとも `std / taiko / catch / mania / interface / fonts / configs / sounds / stable / extras` を扱う。
- matrix は `buildAssetMatrix`、tree は `buildAssetTree` を使う。
- filter は `primaryRowsOnly`、`collapseStable`、`requiredLevel` を含む。

### Backend boundary

- filesystem read/write は Rust/Tauri 側が担当する。
- frontend は Tauri invoke と `convertFileSrc` を介して native 機能に触れる。
- native shell behavior は `src-tauri` に隔離される。
- shared packages は Tauri API や DOM に依存しない。

### Export behavior

- export preset は `full`, `sd-only`, `hd-only`, `diff`, `backup` を持つ。
- export では project raw files を zip 化する。
- diff export は main source snapshot との差分を出す。
- backup export は project directory 全体を含む。

## Non-goals

- osu!lazer の `client.realm` を直接破壊的に編集すること。
- 完全再現 renderer を最初から作ること。
- SaaS 化すること。
- web app だけで完結させること。
- Pro 実装を public repo に置くこと。

## Design candidates / open questions

### Lazer compatibility

- osu!lazer の Realm / hash-based storage を read-only resolver として扱う案がある。
- ただし現時点では未実装で、将来の互換レイヤー候補である。

### Workspace materialization

- virtual skin mount を copied workspace / symlink / FUSE 的層のどれで表現するかは未決である。
- MVP は copied workspace で十分という案がある。

### Preview depth

- 画像 / 音声 / context preview / mode-specific grouped preview は候補として有力である。
- 完全な osu!framework ベース renderer は未決である。

### Editing depth

- file replace / rename / delete / restore / external editor / reveal in file manager は safe edit の候補である。
- skin.ini の comment / formatting preserve をどこまで保証するかは未決である。

### Distribution

- Linux binary, AppImage, deb/rpm の優先順位は未決である。
- Pro / Free の機能境界は未決である。

## Guardrails

- `@tenzyu/ui` に app-specific logic を入れない。
- `@tenzyu/osu-skin-core` は runtime-pure に保つ。
- Tauri/native behavior は explicit interface の内側に閉じる。
- 未決事項は確定仕様として書かない。
- 仕様更新時は、確定事項と候補を分けて維持する。

## Current implementation notes

- project create / add source / rename / delete は Rust commands で実装されている。
- asset group apply / delete は raw project files を更新して structured mirror を再構築する。
- structured mirror は現状、保守的な raw copy として実装されている。
- Preview は現状 mock ベースで、完全 renderer ではない。

## Open questions

- Rust backend にどこまで domain logic を寄せるか。
- TypeScript core と Rust core をどこまで分担するか。
- asset matrix と validation の最終 contract をどこで固定するか。
- Tauri desktop と local web fallback の優先度をどこまで保つか。
- 将来の Pro / private distribution を repo 構成上どう分離するか。
