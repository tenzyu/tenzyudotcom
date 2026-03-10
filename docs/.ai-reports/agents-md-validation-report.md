---
name: agents-md-validation-report
description: AGENTS.md の妥当性評価と、メンテナンス性の観点からの改善案をまとめた報告書。
summary: ルールの衝突（ディレクトリ階層）とデータスキーマの不足を特定し、再実装・保守の完結性を評価する。
read_when:
  - アーキテクチャルール（AGENTS.md）を更新・改訂する時
  - 大規模なリファクタリングや再実装をエージェントに依頼する前
skip_when:
  - 個別のコンポーネント修正など、局所的な作業のみを行う時
user-invocable: false
---

# AGENTS.md Validation Report

## 評価サマリー

`docs/design-docs/AGENTS.md` および関連する設計文書の妥当性を「メンテナンス性」の観点から評価した結果、アーキテクチャの方向性は非常に強力であるものの、**ディレクトリ構成の定義における矛盾**と、**データスキーマの具体性不足**が、エージェントによる自律的な再実装や保守の妨げになる可能性があることが判明した。

### スコア: 72/100 (Maintenance-focused)

- **アーキテクチャの一貫性:** 8/10
- **記述の具体性・行動可能性:** 6/10
- **再実装の完結性:** 4/10
- **保守の容易性:** 9/10

---

## 1. 衝突しているルール・矛盾点

### A. ディレクトリ階層の定義矛盾 (HIGH IMPACT)
- **衝突箇所:**
  - `Rule 1.3 (Path & Feature Semantics)`: 「`components/`, `hooks/`, `lib/` はトップレベルではなく、feature 内部を整理するために使う」
  - `Rule 1.1 & 1.5 (Ownership Model / Directory Strictness)`: 「`src/components/shell/`, `src/components/site-ui/`, `src/lib/`」を正当なレイヤーとして定義。
- **問題:** エージェントが `src/` をゼロから構成しようとした際、`src/lib` や `src/components` の作成が「禁止」なのか「推奨」なのか判断できず、構造が破壊されるリスクがある。

### B. 命名規則の不一致 (LOW IMPACT)
- **衝突箇所:**
  - `Rule 1.7 (VSA)`: `feature-a.model.ts`
  - `Rule 1.6 (Dependency Inversion)`: `*.domain.ts`
- **問題:** ビジネスロジックを担うファイルのサフィックスが統一されておらず、コード生成の一貫性が失われる。

---

## 2. 再実装を阻害する「判断基準の欠如」

### A. データスキーマとコンテンツモデルの不在
- **現状:** `docs/product-specs/` は定性的な方針に留まり、具体的な Zod スキーマや JSON/MDX のキー定義が記述されていない。
- **課題:** `Rule 5.7 (Target over Current)` は「現在のコードではなくドキュメントを正とせよ」と命じているが、ドキュメントにスキーマがないため、エージェントは動作するデータ構造を再現できない。

### B. グローバル Hooks/Utils の配置場所
- **課題:** `Rule 1.3` で `src/hooks/` が制限されているため、複数 feature で共有される Hook の配置先（`src/lib/hooks/` なのか `src/features/common/hooks/` なのか等）が明文化されていない。

---

## 3. 改善推奨アクション

1. **Rule 1.3 の精緻化**: 「所有権が不明瞭な状態でのトップレベル配置」を禁止する表現に改め、`src/components/site-ui` 等の例外を明示する。
2. **Contract Document の拡充**: `product-specs` 内、あるいは独立した `docs/design-docs/contracts/` にて、主要なエンティティ（Notes, Links 等）のデータ構造（Zod スキーマ相当）を定義する。
3. **命名の統一**: `*.model.ts` を廃止し、`*.domain.ts` (純粋ロジック) と `*.contract.ts` (境界定義) へ VSA セクションの記述も統合する。

## 結論

本リポジトリの `AGENTS.md` は、エージェントが「迷わず正解に辿り着く」ための優れた地図だが、一部の標識が逆方向を指している。上記の矛盾を解消し、データ構造の定義（Contract）を追加することで、完全な自律的再実装が可能なレベルに到達できる。
