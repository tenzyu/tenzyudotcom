---
name: harness-subagent-orchestration-workflow
description: メインエージェントが exec-plan を起点にサブエージェントへ作業を委譲する標準運用。
summary: 運用判断の同一性を担保するため、依頼の受付から委譲・レビュー・完了までの厳格なステートマシンを定義する。
read_when:
  - 新しい依頼を受けて task routing を決める時
  - active plan をサブエージェントへ委譲する時
  - サブエージェントの結果を review / integrate する時
skip_when:
  - 既に対象 plan と担当 agent が確定しており、個別実装だけを進める時
user-invocable: false
---

# Subagent Orchestration Workflow

この repo では、メインエージェント（Orchestrator）が司令塔になり、作業単位は `docs/exec-plans/active/*.md` に揃える。
active plan は backlog を含む作業用 artifact であり、委譲可能なのはその中で `execution-ready: true` を満たした plan だけである。
この文書の目的は、**「違う LLM / 違うセッションでも同じ運用判断（Decision Consistency）に至る」**ための厳格なプロトコルを定義することである。

## Core Principles

- **Managerial Orchestrator**: メインエージェントは自身でコードを書かず、戦略、計画、委譲、レビュー、統合、アーカイブに専念する。
- **Plan-First Execution**: 実行は常に `active plan` を起点にする。会話や prompt の指示だけでアドホックに実装を開始しない。
- **Backlog Continuity**: active plan は session memory を兼ねる。意味のある進捗、判断、次の着手点は毎回 plan に戻す。
- **Progressive Disclosure**: `AGENTS.md` をルートとし、必要に応じて詳細な design-docs や product-specs へ潜る。

## Document Split

- [plan-authoring-workflow](./plan-authoring-workflow.md): plan の下書きや昇格を補助する
- [exec-plan-contract](./exec-plan-contract.md): `execution-ready` plan の必須項目を定義する
- この文書: orchestrator が plan を委譲、review、archive する

## 1. Intake Protocol (受付)

依頼を受けた直後、メインエージェントは以下の順序で判断する。

1.  **Context Discovery**: `AGENTS.md` を読み、関連する domain/workflow を特定する。
2.  **Plan Collision Check**: `docs/exec-plans/active/*.md` をスキャンし、重複・関連する進行中 task がないか確認する。
    - 関連があれば、その plan を update するか、依存関係を定義する。
3.  **Inquiry vs. Directive**:
    - **Inquiry (調査・提案)**: `active plan` は作らず、調査結果と提案を返す。
    - **Directive (実行指示)**: [plan-authoring-workflow](./plan-authoring-workflow.md) に従い、`active plan` を作成または昇格させる。
4.  **Continuity Update**: 実装に着手しない場合でも、active plan が存在するなら進捗、判断、次の着手点を更新してセッションを閉じる。

## 2. Delegation Protocol (委譲)

サブエージェントへ作業を渡す際は、[exec-plan-contract](./exec-plan-contract.md) を満たした `execution-ready: true` の plan を path 指定で渡す。

- **1 Task = 1 Plan**: 原則として 1 つの PR / commit 単位に 1 つの plan を割り当てる。
- **Strict Scope**: `allowed file scope` を明示し、サブエージェントが範囲外を「ついでに直す」ことを防ぐ。
- **Verification First**: 成功判定に必要な `nix develop -c ...` コマンドを plan 内に確定させてから渡す。

## 3. Review & Integration Checklist (レビューと統合)

メインエージェントは、サブエージェントからの成果物を以下の観点でチェックする。

- [ ] **Plan Alignment**: `active plan` の `Goal` と `Deliverables` をすべて満たしているか。
- [ ] **Architecture Check**: [ARCHITECTURE](../ARCHITECTURE.md) および [structure-rules](../design-docs/structure-rules.md) の配置・所有権ルールを守っているか。
- [ ] **Quality Check**: [QUALITY_SCORE](../QUALITY_SCORE.md) の「Dirty Code 禁止」や「境界バリデーション」がなされているか。
- [ ] **Design Check**: UI 変更がある場合、[DESIGN](../DESIGN.md) のトークン利用や a11y 要件を満たしているか。
- [ ] **Verification Result**: `required verification` がすべて Pass し、ログが提示されているか。
- [ ] **Doc-Gardening**: コード変更に伴い、関連する `docs/` や `AGENTS.md` の更新が必要な場合、それも含まれているか。

## 4. Completion & Archive Protocol (完了と記録)

`Completion Signal` を満たしたら、以下の手順でタスクを閉じる。

1.  **Fact Recording**: plan 末尾に、何を確認して完了としたかの事実（テスト結果、PR番号など）を追記する。
2.  **Metadata Update**: frontmatter の `description` と `summary` を「現在進行形」から「完了済みの歴史的記録」へ書き換える。
3.  **Move to Completed**: `docs/exec-plans/active/` から `docs/exec-plans/completed/` へファイルを移動する。
4.  **Promote Gaps**: 実装中に発見した新たな課題や保留事項があれば、`docs/exec-plans/tech-debt-tracker.md` へ追記する。

`docs/exec-plans/completed/*.md` は pure work log であり、rule の正本として扱わない。

## Failure Handling (不一致の解消)

もしサブエージェントの結果が Review Checklist を満たさない場合、メインエージェントは以下を行う。

1.  修正すべき点と、その根拠となる `docs/` の path を提示して再送する。
2.  もし plan 自体に不備（scope 不足など）があった場合は、まず plan を修正してから再委譲する。
