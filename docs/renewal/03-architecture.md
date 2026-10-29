# 資産と最小構成

## 確認した依存

```text
web ──> ui ──> React / Base UI / Tailwind / Storybook
 │       ↑
 ├──> linter                  skin-workbench ──> osu-skin-core
 ├──> Next / Intlayer                └──> Tauri / Rust / GTK
 ├──> GitHub content API ──> 別content repo
 └──> live osu API / YouTube / Twitter

root flake ──> Castalia / Atelier / Serena / native packages
root scripts + Nx + MCP + AGENTS ──> Atelierと旧control pack
```

Nx の graph を実行取得した。package manifest の workspace 依存だけでなく、`web/project.json:10-13` の ui/linter implicit dependencies も存在する。全てのファイル依存を精査した図ではない。

## 再利用価値が高い部分

- `osu-skin-core`: skin分類、DTOの境界、web DTOからfilesystem pathを除く契約。9テスト成功。単なるUIより移植費用が高い知識資産。
- Web の locale / 日付 / frontmatter / domain テストと、未追跡scrapsのdomain・projectionテスト。今回104件成功。ただし外部保存の原子性まで証明していない。
- 別content repo の本文と編集JSON。公開ページを廃止しても残す。
- HTML exporter: 他製品へのworkspace依存なし。syntaxとtestsが成功。Webの削減に巻き込む根拠はない。

## 重大な設計問題

|問題|証拠|変更コスト・次の修正単位|
|---|---|---|
|共有registryからroute-local型への逆依存|`src/features/content-editor/editor-collections.ts:1-4` → blog / notes / pointers / puzzles `_features/*.domain`|routeを消すと共通editorが壊れる。残すdomainをfeature側へ移し、全callerを同時変更する|
|credential付きremoteがbuild入力|`src/lib/content-store/github-content.infra.ts:41-59`; `web-build-direct`|静的param収集がGitHub設定なしで停止。明示的な読み取り専用snapshot adapterが必要。空データで隠さない|
|scrapsの複数file保存が非原子的|`scraps/[slug]/_features/scrap-admin.assemble.ts:86-141`|本文→meta→manifest→indexの順。途中失敗・同時追記で孤児や上書きが生じ得る。Git Trees/Commitによる一括更新又はretry可能な設計を比較する|
|単一file更新と複数file整合性の混同|`github-content.infra.ts:165-208` はsha付きPUT|単一fileの競合検出はある。これを理由にscraps全体も原子的とは言えない|
|履歴と現在値の混在|`archives/osu-profile/_features/lib/getUserScores.ts:16-29`; `page.content.ts:16-18,25-28`|「過去のarchive」の中でlive APIを取得する。source/fetchedAt/recordedAtを別に持つ|
|古い年の目標を現在月で強調|`archives/osu-profile/_features/yearly-goals.tsx:7-58`|2025目標に現在月を使い、型castもある。年を含む歴史データモデルにする|
|UI型検査が生成物に依存|`packages/ui/package.json:8-20`; 初回typecheck失敗→UI/Intlayer生成後成功|clean checkoutで必要な前処理をcommand契約にする。型pathだけで取り繕わない|
|旧指示が新目的と衝突|`AGENTS.md`; `opencode.json:63-67`|新しいagent sessionが旧Atelier実装へ戻る。退役時には指示・MCP・goal commandを同時に整理する|

`src/` は `product/apps/web/src/`。scraps の指摘はGitHub developではなく、保全したローカル未コミット版を対象とする。Next固有処理の全流出箇所、巨大component全件、全castの安全性はまだ監査していない。

## 最小案 — AI提案、未採用

既存 Next / React / TypeScript / Bun / Nix web shell を当面維持。Webを1つ、純粋domain、必要なUI、読み取り専用のコンテンツsnapshotに分ける。Nxは今すぐ削除せず、対象をWebに絞り、native製品を別検証にする。DBや新CMSを初手で追加しない。

公開面は「osu」「engineering」「記事詳細」。旧URLは資産としてredirectを評価する。管理画面と書込資格情報はローカル閲覧の必須条件にしない。

### 代替案

既存ページを保ったままナビだけ二軸に再編し、現行GitHub storageを維持する。移行差分は小さいが、データ取得・editor・多言語・nativeを同時に保守する費用が残る。

静的サイトへの全面移行は第三候補。動的編集・live osu値・locale要件が未決なので、今回の測定だけで優位とは判断できない。

## osu復帰の比較

|方式|得るもの|残る問題|推奨|
|---|---|---|---|
|現行実装を修理して復帰|早く既存UIを表示できる|API必須、古い年、外部embed、現在値混在|短期の比較対象|
|データだけ移す|表示・依存を最小化できる|元データの時点・権利整理が必要|静的な歴史部分に適する|
|小さく再実装し必要なadapterを再利用|現在プロフィールと記録を分離できる|新UIと移行テストが必要|推奨。本人の方式承認待ち|

探索範囲: 現在ツリー、全ローカル/追跡refのパス履歴、隣接content repo、ignoredのmetadata。文字列 `osu-archive` の独立製品は未発見。実体は `/archives/osu-profile`。全履歴blobやディスク全体を走査したという主張ではない。
