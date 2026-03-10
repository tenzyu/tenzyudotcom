---
name: src-structure-gap-report
description: AGENTS.md と実際の src 配下のディレクトリ構造・命名規則の乖離をまとめた報告書。
summary: 垂直スライスの局所化不足、環境変数の分散、データ命名規則の不一致など、ターゲットアーキテクチャへの移行課題を特定する。
read_when:
  - リファクタリングやディレクトリ構造の整理を行う時
  - AGENTS.md のルール適用状況を確認する時
skip_when:
  - 個別のコンポーネント修正など、構造に影響しない作業を行う時
user-invocable: false
---

# SRC Structure Gap Report

## 調査サマリー

`AGENTS.md`（v1.0.0）で定義されたターゲットアーキテクチャと、現在の `src` 配下の実装を比較した結果、高いレベルで一貫性が保たれているものの、いくつかの「Smell（不吉な兆候）」とルール違反が確認されました。これらは主に、古い慣習の残存と、VSA（Vertical Slice Architecture）における局所化の徹底不足に起因します。

---

## 1. 所有権モデルと垂直スライスの不徹底 (Rules 1.1, 1.4, 1.7)

*   **問題箇所**: `src/lib/blog/`
*   **詳細**: `blog-frontmatter.contract.ts` や `blog.domain.ts` など、ブログドメイン専用のロジックがグローバルな `src/lib` に配置されている。現状、これらは `src/app/[locale]/(main)/blog/` 配下でのみ使用されている。
*   **乖離理由**: 「再利用の事実がないものはローカルに閉じる（Local-first）」という原則（Rule 1.4）に反し、ドメイン知識がグローバル空間へ漏れ出している。
*   **是正アクション**: `src/lib/blog/` の内容を `src/app/[locale]/(main)/blog/_features/` 配下へ移動する。

## 2. 環境変数の集中管理の不備 (Rules 2.2, 6.1)

*   **問題箇所**: `src/config/site.ts` 内の `BASE_URL` ハードコード
*   **詳細**: サイトのルートURLが定数としてハードコードされており、`src/config/env.contract.ts` による一括管理から外れている。
*   **乖離理由**: 「すべての環境変数をパース・検証する」というセキュリティおよび型安全性の原則（Rule 2.2）を満たしていない。
*   **是正アクション**: `BASE_URL` を環境変数化し、`env.contract.ts` でパース・提供するように修正する。

## 3. i18n 命名規則とデータ配置の不一致 (Rule 5.2)

*   **問題箇所**: 以下の `.data.ts` 命名および `_data/` 配置
    *   `src/app/[locale]/(main)/portfolio/_data/portfolio.ts`
    *   `src/app/[locale]/(main)/(home)/_features/selfie-gallery.data.ts`
    *   `src/app/[locale]/(main)/archives/osu-profile/_features/data/*.ts`
*   **詳細**: 「人が管理する正規ソース」であることを示す `*.source.ts` ではなく、古い `.data.ts` サフィックスが使われている。また、ルート直下の `_data` 配置は「Smell」として明記されている。
*   **乖離理由**: `AGENTS.md` の「Editorial Role Separation」およびディレクトリセマンティクスのルール更新が、既存コードに反映されていない。
*   **反映アクション**: 
    *   `.data.ts` -> `.source.ts` へのリネーム。
    *   `_data/` から `_features/` への移動。

## 4. 早期のフォルダ分割によるオーバーヘッド (Rule 1.3)

*   **問題箇所**: `src/app/[locale]/(main)/puzzles/_features/lib/`
*   **詳細**: ファイル数が少ない（5ファイル程度）段階で、積極的に `lib/` サブディレクトリを作成している。
*   **乖離理由**: 「Small Features Stay Flat」の原則（Rule 1.3）に反し、探索コスト（認知負荷）を不必要に高めている。
*   **反映アクション**: 構造が複雑化するまではフラットに配置し、読み筋が分かれ始めてからフォルダを掘る。

---

## 結論

現状のリポジトリは「入口（Routing）」と「境界（Contract）」が整理されており、非常に健全です。上記の課題は、`AGENTS.md` が目指す「ターゲット構造」への収束プロセスにおける最終段階の微調整であり、これらを解消することで「迷わず正解に辿り着ける」コードベースへの純度が高まります。
