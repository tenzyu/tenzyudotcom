---
schema: harness/v1
kind: knowledge
knowledge_type: product-spec
id: knowledge.product-spec.atelier
title: Atelier Product Spec
status: active
summary: Agentic software development control plane for artifact graph reconciliation, governance, verification, and role-routed agent work in tenzyudotcom.
tags:
  - atelier
  - harness
  - context-routing
  - doctor
  - agent-workflow
  - domain:atelier
  - domain:harness
  - kind:spec
  - status:active
pattern: multi-context
affordances:
  declared: [context, skill-candidate]
freshness:
  source: authored
  update_policy: review_required
---

# Atelier Product Spec

Atelier is an **Agentic Software Development Control Plane**.

It is not an autonomous agent.  
It is not a generic RAG system.  
It is not a Markdown CMS.  
It is not a standalone source of truth outside the repository.

Atelier manages project knowledge, governance, tasks, agents, checks, skills,
permissions, hooks, and runtime traces as a continuously reconciled artifact
graph.

Humans act as product owners. Agents perform implementation work. Atelier keeps
the system coherent, governed, observable, and progressively automatable.

In Japanese:

```text
Atelier は、LLMエージェントによるソフトウェア開発を、
知識・権限・タスク・検証・実行・協調の面から制御する
Agentic Software Development Control Plane である。
```

The previous model, "Markdown as source of truth / Atelier as compiler", remains
useful as the v1 adoption path. It is no longer the final product definition.
The final model is:

```text
system state = Git working tree + Atelier Artifact Graph + Event Log
```

Markdown, checks, skills, linters, hooks, permissions, roles, tasks, runs, and
traces are all artifacts that Atelier observes, relates, reconciles, and may
materialize.

## 1. Problem

The repository already has useful harness material:

- reusable knowledge under `harness/knowledge`
- policies under `harness/policies`
- callable workflows under `harness/actions/workflows`
- roles, phases, and artifact templates under `harness/actions`
- run records under `harness/runs`
- root and tool adapters under `harness/adapters`

This is valuable, but raw Markdown does not maintain itself.

Without a compiler and operation layer, the harness tends to decay through:

- stale paths
- broken Markdown links
- duplicated guidance
- old `legacy ai-org path` references
- inconsistent role and workflow references
- knowledge that no role ever selects
- role files that require broad manual search
- run records that do not preserve the selected context
- agent behavior that falls back to `grep` instead of using the harness contract

The current design direction is role-routed context development:

```text
human request
  -> workflow selection
  -> role assignment
  -> context query
  -> run manifest
  -> execution
  -> observation
  -> knowledge proposal
  -> promotion
```

Atelier is the tool that makes this loop operational.

## 2. Goals

Atelier must reduce the cost of using and maintaining the harness.

Atelier must grow from the current Knowledge Plane and Role Context Compiler
into a control system composed of:

```text
Atelier =
  Knowledge Plane
  + Governance Plane
  + Verification Plane
  + Task / Product Plane
  + Swarm Coordination Plane
  + Agent Runtime Plane
  + Human Product Owner UI
```

The kernel underneath those planes is:

```text
Core Kernel:
  Artifact Graph
  Event Log
  Reconciler
  Selector
  Policy Engine
  Materializer
  Trace
```

The current implementation covers the first useful slice of this system:
Knowledge Plane, Verification Plane, Role Context Compiler, run lifecycle, MCP,
and an initial GUI.

### 2.0 Control Plane Coherence

Atelier must continuously reconcile project control artifacts instead of only
compiling Markdown into generated files.

It must:

- observe source files, generated files, control files, run records, and task
  records
- identify which Artifact each change affects
- preserve lineage across moves, renames, edits, and deletions
- classify risk before asking humans for decisions
- auto-reconcile low-risk changes
- create advisory findings or tasks for medium-risk drift
- require human decisions only for product intent, high-risk policy changes,
  destructive operations, and unresolved ambiguity
- block operations that violate explicit path, command, secret, or permission
  policy

### 2.1 Context Selection

Atelier selects context from the harness without requiring agents to manually search all Markdown.

It must support queries such as:

```bash
atelier context plan \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth"
```

The result must explain:

- selected documents
- skipped documents
- selection reasons
- estimated context cost
- required versus optional context
- missing metadata or weak routing signals

### 2.2 Run Creation

Atelier materializes selected context into a run.

A run must preserve:

- workflow
- assigned roles
- user intent
- target paths
- selected documents
- selection reasons
- document hashes
- generated time
- required artifacts

`context.md` is the first file an agent should read for a run. It is an
agent-readable compiled context pack, not a simple link list and not a raw copy
of every selected source document. It must embed the constraints, procedures,
excerpts, and judgment material needed to start the task, while preserving paths
and IDs for provenance and expansion.

`context.manifest.json` is the machine evidence for the pack. It stores source
paths, IDs, hashes, selection reasons, generated time, budget estimates, and
later expansion records. It must not become a duplicate body store.

Atelier must generate:

```text
harness/runs/active/<RUN-ID>/
  brief.md
  context.md
  context.manifest.json
```

Context generation modes:

```text
compact
  default mode; embed required constraints and excerpts

full
  embed required source bodies when practical

linked
  link-centered mode for low-cost plan review or human checks
```

Additional context may be expanded only when the context pack allows it, the
investigation proves the pack is insufficient, or a command/error references
uncovered context. Expansions should be recorded in `context.manifest.json` and
`worklog.md`.

Additional run artifacts are created or completed later:

```text
plan.md
worklog.md
verification.md
review.md
handoff.md
knowledge-proposals/
```

### 2.3 Harness Integrity

Atelier must detect corruption and drift.

`atelier doctor` must check:

- invalid frontmatter
- duplicate IDs
- missing IDs
- unresolved symbolic references
- broken Markdown links
- old path references
- stale `legacy ai-org path` references
- workflows referencing missing phases
- roles referencing missing documents
- context manifests with hash mismatches
- generated indexes that are stale
- orphan knowledge that no selector can reach
- selectors that are too broad or too narrow

### 2.4 Knowledge Growth

Atelier must allow the harness to grow from run evidence without turning the knowledge base into a dumping ground.

The default knowledge workflow is:

```text
run evidence
  -> proposal
  -> validation
  -> human or policy-gated approval
  -> promotion
  -> index regeneration
```

Atelier must not automatically promote raw logs, guesses, or one-off observations into durable knowledge.

### 2.5 Agent Compatibility

Atelier must be usable by humans, shell scripts, and agents.

The same core operations must be available through:

- CLI
- MCP server
- GUI
- generated skills or adapter documents

Atelier must not require a specific agent runtime.

## 3. Non-Goals

Atelier must not become:

- an uncontrolled generic autonomous agent runtime
- a chat UI
- a vector database first system
- a generic note-taking app
- a replacement for Git
- a replacement for Nx, Bun, or existing repo tooling
- a source of truth outside Git and the repository artifact graph
- a UI-only stateful database
- a system that requires all completed runs to be migrated to a strict schema
- a system that forces every small code change to create new durable knowledge

Atelier may expose CLI, MCP, GUI, hooks, and agent-runtime surfaces, but those
surfaces must call the same core operations and must not create independent
state.

## 4. Core Principles

### 4.0 System State Is Not Markdown Alone

Markdown is one important artifact type, not the complete source of truth.

The final Atelier state model is:

```text
source of truth = Git working tree + Atelier Artifact Graph + Event Log
```

This matters because real projects change through many channels:

- Markdown is edited, moved, or deleted.
- Checks, skills, linters, hooks, permissions, and roles are edited by humans or
  agents.
- Tasks are created, delegated, completed, or abandoned.
- LLM runs produce traces, failures, proposals, and generated files.
- Directory structure changes may touch hundreds of files at once.

Atelier must treat all of those as artifact events and reconcile the project
state from the combined evidence.

### 4.1 Markdown Is Authoring Source, Not the Database

Markdown remains useful for human-readable meaning:

- design rules
- product specs
- ADRs
- workflows
- policies
- handoffs
- verification notes

Markdown should not manually carry derived data such as:

- reverse role indexes
- full repo maps
- dependency graphs
- link graphs
- stale status
- context bundle results
- generated role bundles

Derived data belongs under `.harness/generated`.

Durable Atelier control state belongs under tracked repository paths, not under
the ignored generated cache. The initial durable state root is:

```text
harness/atelier/
  graph.json
  events.ndjson
```

`.harness/generated` remains a rebuildable projection/cache.

### 4.2 One-Way Authored References

Do not create bidirectional hand-maintained links.

Allowed:

- roles define selectors
- knowledge declares intrinsic metadata
- generated indexes compute reverse relationships

Avoid:

- `knowledge.roles`
- `knowledge.required_by`
- hand-maintained reverse role lists
- duplicated role bundles inside knowledge files

Knowledge should not need to know every role that may read it.

### 4.3 Role as Context Router

A role is not an agent personality.  
A role is a context routing profile.

A role defines:

- activation conditions
- path selectors
- tag selectors
- pinned documents
- default phases
- outputs
- review criteria

Atelier uses roles to select context.

### 4.4 Runs Lock Context

A run must lock the selected context before execution.

This preserves:

- what the agent read
- why those documents were selected
- which version was read
- whether the context changed during work

Do not copy full knowledge bodies into run records unless explicitly needed for evidence. Store IDs, paths, reasons, and hashes.

### 4.5 Doctor Before Expansion

Do not add new complexity until `atelier doctor` can detect existing corruption.

The first value of Atelier is not a GUI.  
The first value is making the harness hard to silently break.

### 4.6 Progressive Strictness

Do not apply strict schema requirements to all Markdown equally.

Recommended levels:

```text
Level 0: Free Markdown
  completed runs
  historical handoffs
  legacy notes

Level 1: Indexed Markdown
  knowledge
  policies
  product specs
  ADRs

Level 2: Routable Markdown
  roles
  workflows
  phases

Level 3: Generated Data
  repo map
  path ownership
  role bundles
  diagnostics
```

Completed run history should be readable and searchable, but it should not be forced through every future schema migration.


### 4.7 Maintainer Decisions For Source Contracts

The current source-contract policy is intentionally asymmetric. It minimizes manual maintenance while preserving reproducibility.

- Completed run history is loose historical text. It should not be forced through future frontmatter migrations.
- Knowledge must not manually point back to roles. Role-to-knowledge relationships are produced by role selectors and generated indexes.
- Knowledge uses `tags` as the primary retrieval signal. Legacy `read_when` / `skip_when` fields are deprecated; new knowledge must use `conditions.deterministic` and `conditions.semantic` instead.
- Legacy display fields such as `impactDescription`, `chapter`, `name`, `description`, and `user-invocable` belong under `x.legacy` when preservation is useful. They are not routing fields.
- Tags must be YAML arrays. Scalar comma-separated tags are invalid for deterministic indexing.
- Domain roles must declare routing metadata with `selectors` and `pinned` context.
- Root and tool adapters must route non-trivial work through `atelier run init` and `atelier run close`.
- Small direct edits to existing knowledge are allowed when the correction is narrow and obvious. New durable knowledge should go through proposal and promotion.
- Current harness guidance must not reference removed legacy paths. Historical completed runs may keep historical text.

## 5. Source Layout

### 5.1 Authored Sources

```text
harness/
  atelier/
    graph.json
    events.ndjson
  canon/
  knowledge/
  policies/
  actions/
    workflows/
    roles/
    phases/
    artifacts/
  runs/
  observations/
  adapters/
```

### 5.2 Generated Sources

```text
.harness/
  generated/
    docs.json
    ids.json
    knowledge-index.json
    role-bundles.json
    workflow-index.json
    repo-map.json
    path-ownership.json
    link-graph.json
    diagnostics.json
```

Generated files are cache artifacts. They must be reproducible from repository source and may be deleted and rebuilt.

### 5.3 Implementation Location

Atelier currently lives as a CLI-first application under:

```text
product/apps/atelier/
  src/core/
    docs.ts
    frontmatter.ts
    indexer.ts
    doctor.ts
    context.ts
    runs.ts
    knowledge.ts
  src/cli.ts
```

The app must keep core operations reusable from CLI, MCP tools, and GUI surfaces.

If the code becomes useful outside the app boundary, only the shared core may later be promoted to a package. The UI, when added, must call the same core operations and must not become a separate source of truth.

### 5.4 Artifact Graph Kernel

The central data structure is the Artifact Graph.

Minimum artifact shape:

```text
Artifact:
  id
  kind
  path
  contentHash
  metadata
  ownership
  status
```

Initial artifact kinds:

```text
markdown
knowledge
check
skill
linter
role
task
permission
hook
agent
team
run
trace
source-file
generated-file
decision
product-intent
control-mechanism
```

Minimum edge shape:

```text
Edge:
  from
  to
  kind
  confidence
  source
```

Initial edge kinds:

```text
derives_from
implements
satisfies
guards
validates
selects
scopes
supersedes
conflicts_with
observed_from
emitted_as
edited_by
```

Atelier must not assume Markdown is the only parent of operational controls. A
linter rule, hook, permission file, CI gate, check, test, skill, or run trace can
also reveal project knowledge.

### 5.5 Event Log

The Event Log records observations that explain graph state.

Initial events:

```text
file_changed
file_moved
file_deleted
artifact_observed
artifact_edited
artifact_deleted
artifact_emitted
run_started
run_completed
rule_changed
policy_decision
reconciliation_finding
```

The event log must be append-only for durable history. Rebuildable graph
snapshots may be materialized from the working tree and event log.

### 5.6 Ownership Modes

Every artifact has an ownership mode:

```text
observed
  Atelier reads the artifact but does not write it.

generated
  Atelier may fully regenerate it.

managed
  Atelier owns specific marked ranges or records.

curated
  Humans or agents may edit it; Atelier rereads it and reconciles downstream effects.

external
  External tools own it; Atelier observes and respects it.

deprecated
  Kept for history but not selected for new work by default.
```

Checks, skills, linters, hooks, and permission rules should usually become
`curated`, not permanently `generated`. A curated edit is not automatically
drift; it may be new knowledge.

### 5.7 Reconciler

The Reconciler interprets change and chooses the lowest-friction safe action.

Risk actions:

```text
silent
  No user-facing action or automatic lineage update only.

auto-reconcile
  Update graph state and derived projections automatically.

advisory
  Surface a warning without blocking work.

task
  Create or suggest a follow-up task.

human-decision
  Ask a human product owner or maintainer for a specific decision.

block
  Stop execution because explicit policy would be violated.
```

Deletion is first-class. A deleted Markdown file, check, skill, linter, hook,
role, or permission can mean:

```text
intentional removal
move / rename
replacement
accidental deletion
policy violation
```

Atelier must use deterministic signals before semantic interpretation:

```text
Level 0: Exact
  hash, id, path, schema, AST, git diff

Level 1: Structural
  markdown AST, import graph, package graph, command graph, dependency graph

Level 2: Rule-based
  selectors, path rules, command rules, permission rules

Level 3: Heuristic
  similarity, rename detection, scope inference, stale detection

Level 4: Cached Semantic
  previous summaries, block embeddings, known classifications

Level 5: LLM Semantic
  ambiguous classification, meaning diff, intent inference

Level 6: Human
  product judgment, priority, risk tolerance, dangerous change approval
```

Programmatic certainty wins over LLM interpretation. Human attention is reserved
for product value, high-risk governance, destructive operations, and unresolved
intent.

## 6. Document Model

Atelier v1 treats harness Markdown as Markdown-backed objects. This remains the
current Knowledge Plane and Role Context Compiler implementation, but it is now
one projection of the broader Artifact Graph model.

```text
Markdown document =
  frontmatter metadata
  + body
  + compiled index entry
```

### 6.1 Common Frontmatter

Minimum common fields:

```yaml
---
schema: harness/v1
kind: knowledge
id: knowledge.rule.example
title: Example Rule
status: active
---
```

Common fields:

```yaml
schema: harness/v1
kind: knowledge | role | workflow | phase | policy | artifact-template | run | observation | adapter | canon
id: stable.symbolic.id
title: Human-readable title
status: draft | active | deprecated | archived
summary: Short summary
tags:
  - example
supersedes:
  - old.id
superseded_by: new.id
x:
  any experimental extension
```

The schema must allow extension fields. Unknown fields should be warnings only unless they conflict with reserved names.

### 6.2 ID Rules

IDs are path-independent symbols.

Good:

```text
role.domain.web-app-engineer
workflow.isolated-run
phase.verification
knowledge.rule.security.server-actions-require-auth
policy.repository
artifact.verification
```

Bad:

```text
harness.actions.roles.domain.web-app-engineer
harness.knowledge.rules.security.server-actions-require-auth
```

A file may move without changing its ID.

Atelier must provide symbolic rename:

```bash
atelier id rename OLD_ID NEW_ID
```

This must update:

- frontmatter IDs
- explicit symbolic references
- generated indexes
- context manifests when applicable
- diagnostics

Atelier must preview the change before writing.

### 6.3 Knowledge Card Model

Knowledge は **Markdown-backed 意味ノード**であり、本文の意味解釈は LLM に委ねる。
frontmatter はその知識の**型・接続・選択条件**を宣言する索引兼型注釈である。

This model is the v1 Markdown-backed Knowledge Plane. In v2, Knowledge may also
be extracted from checks, linters, hooks, CI, package scripts, code structure,
import graphs, failed runs, review comments, traces, and human decisions.

#### 6.3.1 設計原則

1. **Markdown body は意味本体。決定論的にしない。**
2. **frontmatter は索引・型・関係・条件だけを持つ。本文の意味を複製しない。**
3. **affordance は emit ではなく transformability hint。**
   LLM が発見した変換可能性 (`inferred`) は proposal 扱いとし、承認 (`accepted`) を経て deterministic artifact へ昇格する。
4. **relations は自動注入の裏口にしない。**
   edge type と injection mode を明示し、selector 未マッチの知識が裏口から注入されるのを防ぐ。
5. **id は stable address。tags は retrieval signal。**
   両者は似せてよいが、一方から他方を推論しない。validator が不自然なズレを警告する。

#### 6.3.2 Knowledge Card Frontmatter

```yaml
---
schema: harness/v1
kind: knowledge

# === 安定アドレス ===
id: web.component.policy

# === 型（読まれ方の定義） ===
pattern: simple | conditional | inheritance | collector | constants | fragment | factory | multi-context

# === 人間向け ===
title: Web Component Policy
summary: Rules for React component structure in the web app.
status: active | draft | deprecated | archived

# === 索引信号 ===
tags:
  - domain:web
  - layer:foundation
  - kind:rule
  - subject:component
  - criticality:high

# === 関係（自動注入の裏口にしない） ===
relations:
  inherit: []
  require_context:
    - id: web.accessibility.policy
      mode: summary
      reason: "Component changes often require accessibility review."
  require_constant: []
  require_decision: []
  related:
    - web.design-token.policy
  conflicts: []

# === 条件 ===
conditions:
  deterministic:
    path_any: []
    tag_any: []
  semantic:
    task_intent_any: []

# === 変換可能性ヒント ===
affordances:
  declared:
    - context
    - check-candidate
    - review-candidate

# === 置き換え関係 ===
supersedes: []
superseded_by: ""

# === レガシーブリッジ ===
x:
  legacy: {}
---
```

#### 6.3.3 各フィールドの意味論

**`id`**
安定アドレス。ファイルを移動しても変わらない。
形式: `<namespace>.<subject>.<purpose>`（例: `web.component.policy`, `nix.flake.policy`）

**`pattern`**
この Knowledge が Context Compiler にどう読まれるかを定義する。詳細は 6.4 参照。

**`tags`**
selector が知識を発見するための索引信号。`prefix:value` 形式。
prefix 一覧は 6.5 参照。

**`relations.inherit`**
Inheritance pattern の基底。base の tags を継承し、解決時は base → child の順に注入する。
body は merge せず、順序付きで独立注入する。継承段数は原則 2 段まで、3 段以上は warning。

**`relations.require_context`**
当該 Knowledge を理解するために必要な文脈。selector 未マッチの場合、`mode` に応じて扱いが変わる:
- `full`: selector 条件を再評価し、条件一致時のみ注入
- `summary`: 要約または抽出のみ注入
- `reference`: trace に参照だけ残す（本文注入なし）

**`relations.require_constant`**
固定値参照。本文注入ではなく値の参照のみ。

**`relations.require_decision`**
条件判定に使う Knowledge。本文注入ではなく、条件評価に用いる。

**`relations.related`**
近い関係だが自動注入しない。探索ヒントとして trace に記録する。

**`relations.conflicts`**
同時に有効化されると危険な Knowledge。両方が selector マッチした場合、criticality または明示的な解決ルールに従う。

**`conditions`**
当該 Knowledge が有効になる条件。
- `deterministic`: path/file/tag ベースの機械判定
- `semantic`: LLM が判定する意図ベースの条件（判定結果は trace に記録）

**`affordances.declared`**
この Knowledge が何に変換されうるかの author hint。
LLM は declared にない affordance を発見してもよい (`inferred`) が、deterministic artifact への昇格には declared または accepted が必要。

### 6.4 Dendritic Patterns

Dendritic Pattern は Knowledge の**読まれ方の型**である。
ファイル種別ではなく、Context Compiler が entrypoint から知識木を解決する際の振る舞いを定義する。

#### 6.4.1 Simple

単独で注入可能な Knowledge。依存を持たず、selector マッチ時にそのまま context に含まれる。

```yaml
pattern: simple
```

解決時: selector マッチ → 注入。最も基本的で扱いやすい。

#### 6.4.2 Conditional

条件が満たされたときだけ注入される Knowledge。
条件は機械判定可能なもの (`deterministic`) と LLM 判定が必要なもの (`semantic`) に分かれる。

```yaml
pattern: conditional
conditions:
  deterministic:
    path_any:
      - "flake.nix"
      - "**/*.nix"
  semantic:
    task_intent_any:
      - "change build environment"
      - "modify package build"
```

解決時: deterministic 条件は機械評価。semantic 条件は LLM に問い合わせ、判定結果を trace に記録。
いずれの条件も満たさなければ注入しない。

#### 6.4.3 Inheritance

基底 Knowledge から文脈を展開する。
tags は継承するが body は merge せず、base → child の順に独立注入する。

```yaml
pattern: inheritance
relations:
  inherit:
    - web.component.policy
```

解決時:
1. base の tags を child に継承（trace に inheritedTags として記録）
2. base の body を child の前に注入
3. 継承段数が 3 段以上の場合は warning

#### 6.4.4 Collector

複数 Knowledge から、特定観点に関係する断片だけを集める。
context を太らせるのではなく、圧縮のために使う。

```yaml
pattern: collector
relations:
  require_context:
    - id: web.component.policy
      mode: summary
    - id: nix.flake.policy
      mode: summary
```

解決時: 各関連 Knowledge から collector の観点に合致する部分のみ抽出。
抽出結果は `mode` に従い、summary の場合は本文の代わりに要約を注入。

#### 6.4.5 Constants

推論させない固定値を持つ Knowledge。
LLM が値を推論・変更してはいけないものを定義する。

```yaml
pattern: constants
```

解決時: 常時注入されるか、`require_constant` 経由で値参照される。
本文は事実のみを記述し、解釈や判断を含めない。

#### 6.4.6 Fragment

単独では注入されず、他の Knowledge に意味部品として混ぜ込まれる小さな Knowledge。

```yaml
pattern: fragment
```

解決時: 単体で selector マッチしない。Collector や require_context summary mode 経由でのみ参照される。

#### 6.4.7 Factory

同型の Knowledge 群を作るための型。それ自体は注入されず、新しい Knowledge を生成するための枠を提供する。

```yaml
pattern: factory
```

解決時: 直接注入しない。`atelier knowledge generate --factory <id> --name <name>` などのコマンドで
新しい Knowledge Card の雛形を生成するために使う。

#### 6.4.8 Multi-Context

1 つの entrypoint から複数の面（Knowledge / Action / Product / Run）へ枝を伸ばす Knowledge。

```yaml
pattern: multi-context
```

解決時: entrypoint の解決時に、複数の layer や domain にまたがる知識を同時に要求する。
単一の selector ではカバーしきれない横断的な context を必要とする場合に使う。

### 6.5 Tag Taxonomy

tag は `prefix:value` 形式とする。平坦 tag はアドレッシング信号として弱いため使用しない。

#### 6.5.1 全 prefix と値一覧

| Prefix | 用途 | 値の一覧 |
|--------|------|----------|
| `domain:` | 影響範囲の製品・領域 | `site`, `atelier`, `harness`, `castalia`, `osu-workbench`, `design-system`, `nix`, `github`, `cli`, `agent` |
| `layer:` | 抽象度の階層 | `foundation`, `product`, `action`, `run`, `check`, `skill`, `workflow`, `implementation`, `security`, `reliability`, `intelligence`, `ui` |
| `kind:` | Knowledge 種別 | `rule`, `spec`, `adr`, `reference`, `known-problem`, `repo-map`, `lesson`, `incident`, `template`, `roadmap` |
| `subject:` | トピック | `a11y`, `admin`, `auth`, `boundary`, `bundle`, `composition`, `content`, `dependency-inversion`, `design`, `error-handling`, `export`, `harness-memory`, `hydration`, `i18n`, `import`, `lint`, `local-first`, `locale`, `metadata`, `migration`, `naming`, `organization`, `ownership`, `performance`, `proxy`, `refactor`, `reliability`, `routing`, `security`, `seo`, `storage`, `strategy`, `structure`, `verification`, `versioning` |
| `criticality:` | 重要度 | `low`, `medium`, `high`, `fatal` |
| `status:` | 状態 | `active`, `draft`, `deprecated`, `archived` |
| `framework:` | フレームワーク（任意） | `next`, `tauri`, `react`, `intlayer`, `nx`, `zod`, `tailwind` |

#### 6.5.2 ルール

- tag は常に `prefix:value` 形式。値にコロンを含めない。
- 1 つの Knowledge に複数の同一 prefix tag を付与してよい（例: `subject:auth` と `subject:component`）。
- prefix の taxonomy は緩やかに管理する。過剰な分類は避ける。
- 新しい prefix の追加は `atelier doctor` の taxonomy check と連動する。

### 6.6 Resolution Trace

Context Compiler は、context pack を生成する際に決定した選択・スキップ・展開の理由を
機械可読な trace として記録する。これにより「なぜこの Knowledge が入ったのか」が説明可能になる。

#### 6.6.1 Trace エントリ

各選択ドキュメントに対して以下を記録する:

```json
{
  "id": "web.component.policy",
  "pattern": "simple",
  "selection": "required | optional | skipped",
  "reasons": [
    {
      "type": "selector.match",
      "selector": "require_all: [domain:web, kind:rule]",
      "matchedTags": ["domain:web", "kind:rule"]
    },
    {
      "type": "selector.match",
      "selector": "require_any: [subject:component]",
      "matchedTags": ["subject:component"]
    }
  ],
  "relations": [
    {
      "type": "require_context",
      "target": "web.accessibility.policy",
      "mode": "summary",
      "resolved": true,
      "reason": "Component changes often require accessibility review."
    }
  ],
  "conditions": {
    "deterministic": {
      "path_any": ["product/apps/web/**"],
      "matched": true
    },
    "semantic": {}
  },
  "affordances": {
    "declared": ["context", "check-candidate"],
    "inferred": [],
    "accepted": []
  },
  "inheritedTags": []
}
```

#### 6.6.2 LLM 判定の記録

semantic condition の判定を LLM に委ねた場合、その結果を trace に残す:

```json
{
  "id": "nix.flake.policy",
  "conditions": {
    "semantic": {
      "task_intent_any": ["change build environment"],
      "evaluation": {
        "method": "llm",
        "input": "fix build cache in nix flake",
        "decision": "likely",
        "confidence": "high",
        "decidedBy": "llm",
        "effect": "included"
      }
    }
  }
}
```

#### 6.6.3 trace の格納場所

Resolution trace は `context.manifest.json` の一部として保存する。
context pack がブラックボックス化するのを防ぐために、trace は常に出力する。

### 6.7 Role Metadata

A role defines selectors.

Example:

```yaml
---
schema: harness/v1
kind: role
id: role.domain.web-app-engineer
title: Web App Engineer
status: active
role_type: domain
activation:
  use_when:
    - changing the public website
  paths:
    - product/apps/web/**
selectors:
  tags:
    - nextjs
    - routing
    - server-actions
    - admin
  paths:
    - product/apps/web/**
  knowledge_types:
    - rule
    - product-spec
    - known-problem
pinned:
  - knowledge.repo-map
  - policy.repository
phases:
  - phase.investigation
  - phase.planning
  - phase.implementation
  - phase.verification
  - phase.handoff
---
```

`pinned` is for mandatory context.  
`selectors` is for generated context expansion.

### 6.8 Workflow Metadata

A workflow is callable.

```yaml
---
schema: harness/v1
kind: workflow
id: workflow.isolated-run
title: Isolated Run
status: active
callable: true
use_when:
  - non-trivial mutable work
role_selection:
  requires_primary_role: true
  allow_supporting_roles: true
phases:
  - phase.intake
  - phase.worktree-isolation
  - phase.investigation
  - phase.planning
  - phase.implementation
  - phase.verification
  - phase.review
  - phase.handoff
---
```

### 6.9 Phase Metadata

A phase is a lifecycle module, not a role.

```yaml
---
schema: harness/v1
kind: phase
id: phase.verification
title: Verification
status: active
phase_order: 60
required_outputs:
  - verification.md
default_artifacts:
  - artifact.verification
---
```

## 7. Generated Indexes

### 7.1 docs.json

Canonical list of parsed documents.

Each entry should include:

```json
{
  "id": "knowledge.rule.example",
  "kind": "knowledge",
  "title": "Example",
  "path": "harness/knowledge/rules/example.md",
  "status": "active",
  "sha256": "...",
  "frontmatter": {},
  "headings": []
}
```

### 7.2 ids.json

Symbol table:

```json
{
  "knowledge.rule.example": {
    "path": "harness/knowledge/rules/example.md",
    "status": "active",
    "sha256": "..."
  }
}
```

### 7.3 role-bundles.json

Generated role context.

```json
{
  "role.domain.web-app-engineer": {
    "pinned": ["knowledge.repo-map", "policy.repository"],
    "selected": ["knowledge.rule.security.server-actions-require-auth"],
    "selectionReasons": {
      "knowledge.rule.security.server-actions-require-auth": [
        "selector.tags:server-actions",
        "selector.paths:product/apps/web/**"
      ]
    }
  }
}
```

### 7.4 diagnostics.json

Machine-readable doctor result.

Diagnostics must include:

```json
{
  "severity": "error",
  "code": "BROKEN_MARKDOWN_LINK",
  "message": "Link target does not exist",
  "file": "harness/knowledge/index.md",
  "target": "../old-path.md"
}
```

## 8. Commands

Atelier must expose a small, stable command surface.

### 8.1 Doctor

```bash
atelier doctor
atelier doctor --json
atelier doctor --fix
```

`doctor` reports corruption.

`--fix` may only apply safe mechanical fixes:

- stale generated files
- old known paths with unambiguous replacements
- formatting of generated files

It must not invent knowledge or silently change policies.

### 8.2 Index

```bash
atelier index
atelier index --check
```

Build generated JSON indexes.

`--check` fails if generated artifacts are stale.

### 8.3 Context Plan

```bash
atelier context plan \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth"
```

The plan command must not create a run by default.

Output must include:

- selected required context
- selected optional context
- skipped context
- reasons
- warnings
- token estimate
- command to render the context pack
- command to materialize a run

### 8.4 Context Render

```bash
atelier context render \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth" \
  --mode compact
```

Render prints the actual agent-readable `context.md` body without creating a run.

Modes must affect rendered output:

- `linked`: links and reasons only.
- `compact`: compiled excerpts of required context.
- `full`: larger required source bodies when practical.

Render is the command to use when a human wants to inspect what an agent will actually read.

### 8.5 Run Init

```bash
atelier run init \
  --workflow workflow.isolated-run \
  --role role.domain.web-app-engineer \
  --path product/apps/web \
  --intent "fix server action auth"
```

Creates a run folder with:

```text
brief.md
context.md
context.manifest.json
```

### 8.5 Run Status

```bash
atelier run status RUN-ID
atelier run status RUN-ID --json
```

Shows:

- current artifacts
- missing artifacts
- context manifest state
- verification state
- doctor result scoped to the run

### 8.6 Run Close

```bash
atelier run close RUN-ID
```

Checks:

- context manifest exists
- selected document hashes are still explainable
- required artifacts exist
- verification is present or explicitly skipped
- handoff is present for non-trivial runs
- no blocking doctor errors affect the run
- knowledge proposals are either promoted, rejected, or left explicitly pending

### 8.7 Knowledge Propose

```bash
atelier knowledge propose \
  --from-run RUN-ID \
  --kind rule \
  --title "Server Actions Require Auth"
```

Creates a proposal, not durable knowledge.

### 8.8 Knowledge Promote

```bash
atelier knowledge promote PROPOSAL_PATH
```

Promotes proposal into `harness/knowledge` after validation.

Must check:

- duplicate candidates
- ID uniqueness
- frontmatter validity
- destination selection
- links
- role bundle impact
- generated index update

### 8.9 ID Rename

```bash
atelier id rename OLD_ID NEW_ID
atelier id rename OLD_ID NEW_ID --write
```

Must preview all affected files.

### 8.10 Repo Map

```bash
atelier repo map
atelier repo owner --path product/apps/web
```

Generates or queries derived repository facts.

### 8.11 Artifact Graph

```bash
atelier scan
atelier graph
atelier impact --path product/packages/ui
atelier blame ARTIFACT_ID
atelier status
```

These commands observe the working tree, build or print the current Artifact
Graph projection, explain impact, show artifact lineage, and summarize
reconciliation state.

`scan` must be read-only by default. It may write `harness/atelier/graph.json`
only through an explicit write mode once the graph schema is stable.

### 8.12 Reconciliation

```bash
atelier reconcile
atelier repair --dry-run
```

`reconcile` reports drift, orphaned controls, deleted sources, replacement
candidates, and policy risks.

`repair --dry-run` previews safe deterministic repairs. It must not change
policy semantics, promote knowledge, delete history, or approve dangerous
permission relaxation.

### 8.13 Control Mechanisms

```bash
atelier controls list
atelier controls coverage
atelier controls missing
```

Control Mechanism is the umbrella concept for ways Atelier makes knowledge and
governance operational:

```text
check
linter
typecheck
test
hook
permission
generator
codemod
template
runtime-guard
review-rule
context-selector
ci-gate
ui-constraint
```

Coverage output must answer which knowledge or product intent is guarded by
which mechanisms, and where enforcement disappeared or became orphaned.

## 9. Context Selection Algorithm

Atelier context selection must be deterministic first.
It operates on the **Knowledge Card Model** (6.3): each knowledge document is a typed node in a DAG,
and the algorithm projects a task-specific tree from an entrypoint by resolving selectors, patterns, relations, and conditions.

In the v2 control-plane model, context selection is a Selector query over the
Artifact Graph:

```text
Context = f(role, task, phase, scope, diff, risk, permissions, budget)
```

Role, Task, Agent, Phase, and Scope must remain separate concepts:

```text
Role:
  perspective, responsibility, and knowledge/control set

Task:
  work to accomplish

Agent:
  execution subject

Phase:
  work stage

Scope:
  affected paths, packages, features, or domains
```

The existing Knowledge Card selector is the v1 implementation of this broader
Selector.

### 9.1 Selection Priority

```text
1. workflow required phases and artifacts
2. role pinned documents
3. repository policies (policy.repository always required)
4. role selector matches
   a. require_all  matches (tag AND)
   b. require_any  matches (tag OR)
   c. exclude      filters out
5. relation expansion (require_context, inherit)
   a. mode:full    → re-evaluate selector; include if matched
   b. mode:summary → inject summary only
   c. mode:reference → trace only, no body
6. pattern-specific resolution
   a. conditional   → evaluate deterministic, then semantic conditions
   b. inheritance   → inject base before child
   c. collector     → extract related fragments by mode
   d. constants     → always include or require_constant reference
7. conditions evaluation (for conditional pattern)
   a. deterministic conditions → mechanical match
   b. semantic conditions → LLM evaluation (trace required)
8. criticality-based truncation when token budget exceeded
9. optional semantic or full-text expansion (non-deterministic, advisory only)
```

Vector or semantic search may be added later as optional expansion only. It must not replace deterministic role/path/policy routing.

### 9.2 Required Context

Required context includes:

- selected workflow
- assigned role files
- pinned policies
- pinned role documents (from role frontmatter `pinned`)
- phases used by the workflow
- policy.repository (always required)
- knowledge documents matched by role `require_all` selectors with `criticality:fatal` or `criticality:high`
- knowledge documents expanded via `relations.inherit` (mode: full)

### 9.3 Optional Context

Optional context includes:

- knowledge documents matched by role `require_any` selectors
- knowledge documents matched by role `require_all` selectors with lower criticality
- `require_context` expansions with `mode: summary` or `mode: reference`
- known problems and incidents matched by tag scope
- conditional knowledge where deterministic conditions are met
- conditional knowledge where semantic conditions are likely (LLM-judged)

### 9.4 Skipped Context

Atelier must explicitly list skipped broad context when relevant:

- completed run history
- knowledge documents with no selector match and no relation path
- deprecated or archived knowledge (status:deprecated, status:archived)
- knowledge documents excluded by role `exclude` selectors
- conditional knowledge where deterministic conditions fail and semantic conditions are unlikely
- superseded documents (superseded_by is set and the superseding document is already selected)

This prevents agents from assuming missing context was forgotten.

### 9.5 Pattern Resolution Details

#### Simple
Selector match → include directly. No further expansion.

#### Conditional
1. Evaluate `conditions.deterministic` (path_any, tag_any) mechanically.
2. If deterministic matches → include.
3. If deterministic does not match and `conditions.semantic` exists → query LLM.
4. LLM evaluation result is recorded in Resolution Trace (6.6).
5. If semantic matches → include as optional.
6. If neither matches → skip.

#### Inheritance
1. Resolve base through `relations.inherit`.
2. Inherit base tags into child (recorded as `inheritedTags` in trace).
3. Inject base body before child body.
4. Warn if inheritance depth exceeds 2.

#### Collector
1. Resolve each target in `require_context`.
2. For each target, extract only the parts relevant to the collector's subject.
3. Inject extracted content per `mode` (summary or reference).

#### Constants
Include when any selector matches, or when referenced via `require_constant`.

#### Fragment
Do not match by selector alone. Only include when another knowledge references it via `require_context` with mode `summary` or `reference`.

#### Factory
Do not include in context. Used only for generating new knowledge card skeletons.

#### Multi-Context
When a multi-context knowledge is selected, the resolver must also evaluate the other planes (product, run, action) that the entrypoint implies. This may trigger additional selector passes.

### 9.6 Trace Production

Every selection decision must produce a traceable reason. The Resolution Trace (6.6) is written into `context.manifest.json` and must record:

- why each document was selected (selector match, relation expansion, condition evaluation)
- which conditions were evaluated and their results
- which LLM judgements were made and their confidence
- which documents were skipped and why
- inherited tags and their source
- relation expansion mode used

## 10. Run Manifest

A run context manifest is the reproducibility boundary.

Required shape:

```json
{
  "schema": "harness-run-context/v1",
  "runId": "RUN-20260602-example",
  "workflow": "workflow.isolated-run",
  "primaryRole": "role.domain.web-app-engineer",
  "supportingRoles": ["role.core.implementer"],
  "reviewRoles": ["role.core.reviewer"],
  "input": {
    "intent": "fix server action auth",
    "paths": ["product/apps/web/**"]
  },
  "selectedDocuments": [
    {
      "id": "knowledge.rule.security.server-actions-require-auth",
      "path": "harness/knowledge/rules/security/security-server-actions-require-auth-even-for-helper-actions.md",
      "sha256": "...",
      "reason": [
        "tag:server-actions",
        "path:product/apps/web/**",
        "impact:HIGH"
      ],
      "required": true
    }
  ],
  "generatedAt": "2026-06-02T00:00:00.000Z"
}
```

The manifest must not contain full document bodies unless explicitly requested.

## 11. Agent Protocol

Agents must not manually discover harness context first.

Default protocol:

```text
1. Run or call `atelier run init`.
2. Read generated `context.md`.
3. Follow the selected workflow and roles.
4. Update required artifacts.
5. Run `atelier run close`.
```

If MCP is available, agents should use MCP tools.  
If MCP is unavailable, agents should use CLI.

Root adapters and generated skills must route agents into this protocol.

Future Atelier-controlled agent loops must pass every tool call through
Governance and Trace:

```text
1. receive task
2. resolve role/context/permission
3. plan
4. request tools
5. PreToolUse governance check
6. execute tool
7. PostToolUse observation
8. update artifact graph
9. run relevant checks
10. decide continue / delegate / ask / stop
11. emit trace
```

The value of Atelier's agent loop is not the ReAct loop itself; it is the
integration with Artifact Graph, Policy Engine, Task state, and Trace.

### 11.1 Governance Plane

Governance is a peer of Knowledge, not a subfeature.

Initial governance concepts:

```text
PermissionMode:
  observe
  suggest
  edit
  restricted-edit
  autonomous
  maintainer
  emergency-stop

PathRule:
  path glob
  allowed operations
  required role
  required checks
  approval policy

CommandRule:
  command pattern
  risk level
  allow / deny / ask / sandbox
  required context

Hook:
  trigger
  condition
  action
  severity

ApprovalPolicy:
  when to ask
  who can approve
  batchable or not
  expires or persistent
```

Approval dialogs are exceptional. Normal flow should be policy-based,
auto-reconciled, advisory, or task-producing.

### 11.2 Swarm Coordination Plane

Swarm means permissioned division of labor, not uncontrolled parallelism.

Initial concepts:

```text
Team:
  available agents
  capabilities
  cost profile
  permission mode
  preferred tasks

Task:
  intent
  scope
  role
  phase
  dependencies
  status
  owner
  assigned agent
  artifacts
  checks
  required outputs

DelegationRule:
  when to spawn subagent
  what context to give
  what tools are allowed
  expected handoff format

BackgroundRun:
  lifecycle
  logs
  cost
  retries
  cancellation
  stale detection
```

Subagents should receive reduced context and narrower permissions than the
parent task whenever possible.

## 12. MCP Interface

MCP is an adapter, not the core.

Future tools:

```text
atelier.doctor
atelier.index
atelier.context.plan
atelier.run.init
atelier.run.status
atelier.run.close
atelier.knowledge.propose
atelier.knowledge.promote
atelier.id.rename
atelier.repo.owner
```

MCP tools must call the same core as CLI.

## 13. Skills and Generated Adapters

Skills should be generated from the harness, not hand-maintained as a separate knowledge source.

Generated skill examples:

```text
.harness/generated/skills/atelier.md
.harness/generated/skills/workflows/isolated-run.md
.harness/generated/skills/roles/web-app-engineer.md
```

Skills explain when and how to use Atelier.  
They must not duplicate full policies or knowledge bodies.

## 14. GUI Requirements

The current Atelier GUI is a v1 inspector and operation launcher.

The target GUI is an **Artifact Graph Editor** for humans acting as product
owners and maintainers.

Target views:

### Knowledge Inventory

- knowledge list
- source artifacts
- scope
- freshness
- conflicts
- enforcement coverage

### Role Matrix

- rows: knowledge, skill, rule, or scope
- columns: role
- cells: include, exclude, conditional, inherited, deprecated
- bulk assignment across paths, packages, phases, and roles

### Scope Map

- path, package, feature, and domain scopes
- assigned knowledge
- assigned controls
- owner role
- risk state

### Task Builder

- product intent capture
- task graph creation
- phase and role assignment
- agent assignment
- required outputs and checks

### Control Coverage

- knowledge and intent coverage by checks, linters, hooks, tests, permissions,
  review rules, context selectors, and CI gates
- missing controls
- orphaned controls
- conflicting controls

### Drift Dashboard

- edits
- deletions
- moves
- replacements
- stale derived artifacts
- reconciliation findings
- tasks requiring follow-up

### Permission Console

- path-level rules
- command-level rules
- tool-level policies
- approval policy
- emergency stop state

### Run Trace Viewer

- what agents read
- what tools they requested
- what commands ran
- what policy decisions happened
- why checks failed
- graph changes emitted by the run

### Team Registry

- agents
- roles
- capabilities
- cost profiles
- permission modes
- delegation rules

### Context Preview

- exact task/role/phase/scope query
- selected knowledge and controls
- skipped artifacts
- token budget
- permission envelope

The GUI must use Atelier commands or core APIs. It must not store independent source-of-truth state.

## 15. Validation and Safety

Atelier must distinguish errors from warnings.

### Errors

Errors block run close or index check.

Examples:

- duplicate ID
- invalid YAML frontmatter
- missing referenced workflow
- missing referenced role
- missing referenced phase
- broken required Markdown link
- context manifest hash mismatch
- generated index stale under `--check`
- Knowledge Card with `pattern: inheritance` but no `relations.inherit`
- Knowledge Card with `pattern: conditional` but no `conditions`
- Knowledge Card with `pattern: collector` but no `require_context`
- relation target ID does not resolve to any existing Knowledge Card
- `criticality:fatal` tag used on a knowledge with no `require_all` selector coverage

### Warnings

Warnings do not block by default.

Examples:

- Knowledge Card has no tags
- Knowledge Card has no selector hits from any role
- Knowledge Card uses `x.legacy` (migration still in progress)
- role selector `require_all` matches zero knowledge documents
- role selector `require_any` matches zero knowledge documents
- role selector is too broad (matches 90%+ of knowledge base)
- inheritance depth exceeds 2
- id namespace prefix does not match any `domain:` tag
- deprecated knowledge still appears in optional results
- optional context exceeds token budget
- completed run uses old paths
- `affordances.declared` is empty (no transformation hint)
- semantic condition has no `task_intent_any` patterns

### Fixes

Atelier may auto-fix only deterministic mechanical issues.

It must not silently:

- promote knowledge
- change a policy
- delete run history
- rewrite design decisions
- infer architecture decisions from weak evidence

## 16. Performance and Context Budget

Atelier must protect context windows.

Context plan must show:

- estimated token count
- required tokens
- optional tokens
- budget warnings
- skipped high-cost files

Context selection must support limits:

```bash
atelier context plan --budget 12000
atelier context plan --required-only
atelier context plan --include-optional known-problems
```

Large documents may later support generated summaries, but summaries must be traceable to source documents.

## 17. Acceptance Criteria

Atelier v1 is acceptable when:

- `atelier doctor` detects broken links, duplicate IDs, stale old paths, and missing references
- `atelier index` generates `docs.json`, `ids.json`, and `diagnostics.json`
- role files can be parsed into routable objects
- workflow files can be parsed as callable objects
- `atelier context plan` returns deterministic selected context for role + path + workflow
- `atelier run init` creates `brief.md`, `context.md`, and `context.manifest.json`
- `atelier run close` blocks missing verification and handoff for non-trivial runs
- generated output is reproducible
- root adapters can instruct agents to use Atelier without duplicating long harness policy
- no completed run history migration is required for MVP

Atelier v2 becomes acceptable when:

- `atelier scan` can observe Markdown, roles, runs, generated files, controls,
  and source files as artifacts
- `atelier graph` can emit a stable Artifact Graph projection
- `atelier status` can summarize graph drift and reconciliation findings
- `atelier reconcile` can classify move, rename, deletion, replacement,
  orphaned control, missing enforcement, and dangerous policy relaxation cases
- `atelier controls coverage` can show which knowledge and product intent is
  guarded by which control mechanisms
- context selection can be explained as a Selector query over role, task, phase,
  scope, diff, risk, permissions, and budget
- governance rules can block explicit path, command, secret, and permission
  violations before an agent tool call runs
- traces explain why Atelier selected context, allowed or blocked a tool call,
  emitted a task, or asked for human decision

## 18. Open Questions

- Should generated files be committed or rebuilt locally?
- Should `atelier run init` create Git worktrees directly or only instruct the agent to follow the worktree phase?
- How strict should `doctor` be in CI?
- Should knowledge proposals live under `.harness/proposals` or under each run folder?
- Which Artifact Graph projections should be committed versus rebuilt locally?
- Which Event Log events are mandatory for v2 and which are optional trace
  details?
- When should curated control edits update durable Knowledge versus remain
  observed graph facts?
