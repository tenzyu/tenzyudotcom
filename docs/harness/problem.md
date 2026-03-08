- route/page 以外の面の owner が未定義です。route.ts、Server Actions、webhook、cron、queue
  worker、DB migration、middleware をどこに置くか決まりません。README.md:111 structure.md:37
  structure.md:103
- feature の粒度定義がありません。page feature なのか、business capability なのか、workflow 単位
  なのかが曖昧です。notifications や billing のような横断機能で必ず揉めます。context.md:74
  structure.md:221
- 6層モデルに backend / ops / contract の受け皿がありません。route-local feature / shared
  feature / site shell / site-shared component / pure shared logic / authored content では足りま
  せん。structure.md:37
- shared feature / `src/components/site` / `src/components/shell` の境界がまだ揺れます。検索
  モーダル、通知センター、コマンドパレット、認証ゲートは「全体に出るUI」ですが、単なる shell でも
  feature でもありません。structure.md:50 structure.md:199
- src/lib の定義が揺れています。Structure では pure shared logic / API helper / parser、Tools で
  は cross-route pure logic です。auth 文脈を持つ shared server helper をどこに置くか決め切れませ
  ん。structure.md:56 tools.md:72 tools.md:86
- config がモデル外です。5層にはないのに、good shared では src/config/site.ts が出てきます。
  feature flags、pricing、limits、roles、env schema の置き場が新たな捨て場になります。
  structure.md:37 structure.md:248
- Intlayer = meaning、data = identifiers は良いですが、中間物が未定義です。料金表や plan matrix
  のように、ID・順序・ポリシー・文言が混ざる構造で source of truth が曖昧です。structure.md:180
  tools.md:82
- promote only after reuse is real は強い原則ですが、schema、policy、event type、permission model
  には遅すぎます。これらは「再利用されたから shared」ではなく「最初から唯一の定義であるべき」で
  す。context.md:52 structure.md:166
- 最初の問いが「1 route 専用か」なのも、route を持たない runtime では破綻します。indexer、mail
  sender、sync worker、admin batch にこの判断軸は効きません。structure.md:223
- Guard の入力分類が狭いです。incident 対応、性能改善、依存更新、security fix、ops 変更、データ移
  行が入りません。guard.md:34
- test 戦略がありません。unit / integration / e2e / contract test をどこに置き、promote/demote 時
  に何を最低限通すかが未定義です。guard.md:113
- migration 規律が弱いです。target へ一歩寄せる は正しいですが、長期移行の途中状態、互換層、
  deprecation の扱いが書かれていません。context.md:95 guard.md:82
- Memory の更新条件が 2 route 基準なのは小さすぎます。大きいプロジェクトでは dashboard + worker
  や webhook + admin の曖昧さも拾う必要があります。memory.md:125
- 「top-level の syntax bucket を主軸にしない」と言いながら、実際には src/components/shell、src/
  components/site、src/components/ui、src/lib、src/config が強い例外です。どこまでが sanctioned
  exception かを継続して明文化する必要があります。structure.md:61 structure.md:210
- replaceability は model-agnostic を強く言う一方、tool layer はかなり Next.js / Intlayer /
  shadcn 前提です。思想を汎用化したいのか、実装ハーネスを repo-specific に保つのか、層ごとに明記
