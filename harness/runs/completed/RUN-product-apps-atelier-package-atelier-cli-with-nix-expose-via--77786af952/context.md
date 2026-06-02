---
schema: harness/v1
kind: run
id: run.active.run-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952.context
title: "RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952 Context"
status: active
summary: "Compiled context pack for Package atelier CLI with nix, expose via root flake like castalia"
tags:
  - harness
  - context
---

# Context: RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952

## Agent Contract

- Read this file first and use it as the initial working context pack.
- Do not manually scan `harness/knowledge/**` before following this context.
- Read additional files only when this context says to expand, investigation proves this pack is insufficient, or a command/error references uncovered context.
- When expanding context, run `atelier context expand <RUN-ID> <DOC-ID-OR-PATH>` when possible and record the reason in `worklog.md`.

## Run

- Workflow: `workflow.isolated-run`
- Roles: `role.domain.repo-ops-engineer`
- Target path: `product/apps/atelier`
- Intent: Package atelier CLI with nix, expose via root flake like castalia
- Context mode: `compact`

## Scope

Allowed by default:

- `product/apps/atelier`
- `harness/runs/active/RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952`

Forbidden by default:

- unrelated product apps or packages
- dependency changes unless the task requires them
- broad harness restructuring outside this run
- completed run history unless diagnosing a repeated harness problem

## Compiled Required Context

### Handoff

Source: `harness/actions/phases/handoff.md`
ID: `phase.handoff`
Reason: required workflow phase 'phase.handoff'

Compiled context:

```md
# Phase: Handoff

Handoff is the minimum unit of cross-agent continuity.

## Output

Create or update:

```txt
handoff.md
```

Use `../artifacts/templates/handoff.md` when creating a new handoff file.

## Required sections

- run summary
- assigned roles
- required knowledge loaded
- what changed
- why it changed
- affected files
- validation result
- remaining risks
- follow-up tasks
- knowledge updates made or proposed

## Rules

- Write handoff for the next agent, not for status theater.
- Keep it concise and factual.
- Include skipped checks and known failures.
- Separate completed work from follow-ups.
- Do not copy raw command noise unless it is needed to diagnose a failure.
- Handoff should make the next human or agent cheaper.
```

### Implementation

Source: `harness/actions/phases/implementation.md`
ID: `phase.implementation`
Reason: required workflow phase 'phase.implementation'

Compiled context:

```md
# Phase: Implementation

Implementation makes the approved change inside scope.

## Output

- source or documentation diff
- `worklog.md` entries for important discoveries
- updated docs or migration notes when required

## Rules

- Make small, reversible changes.
- Stay inside allowed files.
- Follow the assigned role's scope and forbidden scope.
- Do not remove existing features unless explicitly approved.
- Do not silently change public APIs.
- Do not put app-specific logic inside shared packages.
- Do not perform unrelated refactors.
- Record follow-ups instead of broadening the run.
- If mutable work is happening, keep it inside `projectRoot/.worktrees/<task-slug>` as required by `worktree-isolation.md`.

## Quality gates

- Scope is respected.
- Role constraints are respected.
- Existing behavior is preserved unless intentionally changed.
- Follow-up work is recorded instead of hidden in the diff.
```

### Intake

Source: `harness/actions/phases/intake.md`
ID: `phase.intake`
Reason: required workflow phase 'phase.intake'

Compiled context:

```md
# Phase: Intake

Intake converts a human request into a bounded run.

## Primary perspective

Intake coordinator. This is a phase responsibility, not a standalone role.

## Output

Create or update:

```txt
brief.md
```

Use `../artifacts/templates/task.md` when creating a new brief.

## Required sections

- title
- background
- problem
- goal
- scope
- allowed files
- forbidden files
- non-goals
- constraints
- role assignment
- worktree isolation expectation
- validation commands
- acceptance criteria
- risks
- open questions

## Role assignment

Assign the smallest safe role set:

- primary role: owns the domain or main concern
- supporting roles: only when their knowledge bundle is needed
- reviewer role: for non-trivial or risky changes
- governance role: for cost, release, or policy concerns

## Rules

- Do not start broad implementation from a vague request.
- Ask for human decisions only when the scope cannot be bounded safely.
- Mark assumptions explicitly.
- Prefer a small first run over a broad rewrite.
- If an ADR-relevant decision is needed, interview the owner before implementation.
- For non-trivial mutable work, apply `worktree-isolation.md` before implementation or parallel AI handoff.
- Require `projectRoot/.worktrees/<task-slug>` for the worktree path; do not use `../.worktrees`.
- If the request is trivial documentation or formatting, use `workflows/direct-run.md`.
```

### Investigation

Source: `harness/actions/phases/investigation.md`
ID: `phase.investigation`
Reason: required workflow phase 'phase.investigation'

Compiled context:

```md
# Phase: Investigation

Investigation gathers enough evidence to plan safely.

## Output

Record findings in `plan.md` or `worklog.md`.

## Required checks

- affected files
- existing conventions
- current behavior
- suspected root cause, when debugging
- dependency impact
- uncertain areas
- required role knowledge checked
- optional role knowledge deliberately skipped

## Rules

- Inspect before implementing except for trivial edits.
- Prefer precise searches and project facts over broad reading.
- Mark assumptions explicitly.
- Do not invent repository facts.
- Use visible source, Nx project facts, package scripts, and existing docs as evidence.
- Do not load all `harness/knowledge`; follow the assigned role knowledge bundle.
```

### Verification

Source: `harness/actions/phases/verification.md`
ID: `phase.verification`
Reason: required workflow phase 'phase.verification'

Compiled context:

```md
# Phase: Verification

Verification proves that the run requirements were checked with relevant evidence.

## Primary perspective

Verifier. This is a phase responsibility, not a standalone role.

## Output

Create or update:

```txt
verification.md
```

Use `../artifacts/templates/verification.md` when creating a new verification file.

## Required sections

- commands run
- command results
- files inspected
- role knowledge checked
- visual checks performed, when relevant
- tests added or not added
- skipped checks and justification
- failures and follow-up recommendations
- conclusion

## Rules

- Use Nx through Bun for build, test, lint, typecheck, and verify work.
- Run the narrowest relevant checks first.
- For broad changes, run broad checks when practical.
- Commands must map to run requirements.
- If a command fails before testing the change, record the failure exactly.
- Manual checks must be described when automation is insufficient.
- Do not hide failures.
- Do not claim completion from a proxy signal that does not cover the requirements.

## High-risk verification

When verification is high-risk, assign `../roles/core/reviewer.md` separately.
```

### Repo Ops Engineer

Source: `harness/actions/roles/domain/repo-ops-engineer.md`
ID: `role.domain.repo-ops-engineer`
Reason: requested primary role

Compiled context:

```md
## Mission

Maintain workspace automation, policy checks, Nx, Bun, Nix, scripts, and CI behavior.

## Primary scope

- root workspace config
- `repo-ops/**`
- `product/packages/linter/**`
- CI and automation files
- repo-level scripts and policy checks

## Forbidden default scope

- product behavior changes without domain role
- loosening policy checks without owner approval
- cache-disabling changes without documented reason

## Outputs

- scoped automation or policy diff
- affected graph implications
- validation command output
- `verification.md`
- `handoff.md`

## Review criteria

- affected graph implications are documented
- root scripts remain coherent
- cache behavior is not accidentally disabled
- local versus CI assumptions are explicit
- linter findings remain policy boundary signals, not formatting noise
```

### Isolated Run

Source: `harness/actions/workflows/isolated-run.md`
ID: `workflow.isolated-run`
Reason: requested workflow

Compiled context:

```md
## Purpose

Convert a human request into one bounded run executed through assigned roles, selected knowledge, lifecycle phases, verification evidence, and handoff.

## Completion standard

A run is not complete until:

- scope and non-goals are explicit
- assigned roles are recorded
- required role knowledge was checked or skipped with reason
- changed files stay inside scope
- relevant validation ran or skipped checks are justified
- verification evidence exists
- handoff records what changed, why, risks, and follow-ups
- durable knowledge updates were made or explicitly marked unnecessary
```

### Nx Monorepo Operations

Source: `harness/knowledge/monorepo/nx.md`
ID: `knowledge.monorepo.nx`
Reason: pinned by role 'role.domain.repo-ops-engineer'; required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
# Nx monorepo operations

## Purpose

This workspace uses Nx as the task graph and cache layer. Package managers still own installation, and each project still owns its local script implementation. Nx owns orchestration: dependency order, affected project selection, and cache boundaries.

## Project names

| Nx project | Path | Role |
| --- | --- | --- |
| `web` | `product/apps/web` | Next.js application |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Tauri + Vite desktop application |
| `ui` | `product/packages/ui` | Shared UI package and CSS runtime layers |
| `linter` | `product/packages/linter` | Architecture and repository policy CLI |
| `osu-skin-core` | `product/packages/osu-skin-core` | Pure TypeScript skin-domain library |
| `osu-skin-node` | `product/packages/osu-skin-node` | Node/server-side skin filesystem library |

## Daily commands

```bash
bun install
bun run build
bun run check
bun run test
bun run lint
bun run graph
```

App-specific commands remain as compatibility aliases, but new automation should prefer Nx project names:

```bash
bun nx run web:dev
bun nx run skin-workbench:dev
bun nx run ui:build
bun nx run-many -t check
bun nx affected -t build
```

## Dependency order

`web` and `skin-workbench` depend on `ui`. `skin-workbench` also depends on the skin-domain packages. Build targets use `dependsOn: ["^build"]`, so Nx builds dependency libraries before applications.

This is important because app CSS imports `@tenzyu/ui/styles.css` and `@tenzyu/ui/workbench.css`, which are emitted into `product/packages/ui/dist` by `ui:build`.

## Cache boundaries

Targets that produce deterministic artifacts are cacheable:

- `build`
- `build-vite`
- `typecheck`
- `lint`
- `test`
- `check`
- `verify`

Long-running or local-only targets are not cacheable:

- `dev`
- `dev-overlay`
- `start`
- `start-intlayer`
- `clean`
- `format`

## Adding a new package

1. Add a local `project.json` beside the package.
2. Set `name`, `root`, `sourceRoot`, `projectType`, and `tags`.
3. Use `nx:run-commands` unless the package has a strong reason to adopt a framework-specific executor.
4. Add `implicitDependencies` when a project imports workspace packages throu

[Excerpt truncated. Expand the source when this task needs more detail.]
```

### Repository Map

Source: `harness/knowledge/repo-map.md`
ID: `knowledge.repo-map`
Reason: pinned by role 'role.domain.repo-ops-engineer'; required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
# Repository Map

This memory summarizes stable repository ownership. Inspect the current tree
before editing because this file may lag behind active work.

## Workspace

- Root package manager: Bun.
- Task runner: Nx, invoked through Bun.
- Apps root: `product/apps`.
- Packages root: `product/packages`.
- AI organization root: `harness`.
- Repository operations root: `repo-ops`.
- Legacy repo-ops harness content was moved into `harness/legacy/ai-org/docs`; `harness/legacy/ai-org/docs` is a redirect only.

## Projects

| Project | Path | Owner role |
| --- | --- | --- |
| `atelier` | `product/apps/atelier` | Repo Ops Engineer / Harness Engineer |
| `web` | `product/apps/web` | Web App Engineer |
| `skin-workbench` | `product/apps/osu-skin-workbench` | Workbench App Engineer and Rust/Tauri Engineer |
| `ui` | `product/packages/ui` | Design System Engineer |
| `osu-skin-core` | `product/packages/osu-skin-core` | Architect / domain package owner |
| `linter` | `product/packages/linter` | Repo Ops Engineer |
| `ui-react` | `product/packages/ui-react` | TODO: confirm ownership and target status |

## Boundary Memory

- Apps may depend on packages.
- Packages must not depend on apps.
- `@tenzyu/osu-skin-core` is runtime-pure.
- `@tenzyu/ui` owns shared UI primitives and must not absorb app-specific logic.
- Tauri/native behavior belongs under the workbench native boundary.
- Repository validation and policy automation belongs under `repo-ops` or `@tenzyu/linter`.

## Validation Memory

- Use `bun nx run <project>:<target>` for project checks.
- Use `bun nx run-many -t check` for broad checks when scope warrants it.
- Use `bun run policy:deps` for dependency policy validation.
- Record Nx loading failures in task verification instead of silently switching tools.
```

### harness-doc-linter-spec

Source: `harness/knowledge/specs/docs/docs-linter-spec.md`
ID: `knowledge.spec.docs.linter`
Reason: required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
# ドキュメント整備（Doc-Gardening）リンター仕様

このドキュメントは、AGENTS.md を起点とした「段階的開示（Progressive Disclosure）」の構造が維持されているか、およびMarkdownファイルの鮮度・構文が適正かを自動検証するリンター（およびCIジョブ）の仕様を定義します。

## 1. リンク到達アビリティ・チェッカー (Link Reachability Checker)

**目的**: `AGENTS.md` をルートノードとし、そこからリンクされているすべての `docs/**/*.md` ファイルに到達可能か（孤立したドキュメントがないか）、およびリンク切れが存在しないかを検証します。

### 検証要件
- **Entry Point**: ルートディレクトリの `AGENTS.md`。
- **Traverse**: `AGENTS.md` 内の相対リンク（`./docs/...`）をパースし、再帰的にリンク先ドキュメントを検証します。
- **Smart Path Resolution**: リンクが `./docs/` で始まり、かつファイルシステム上で直接解決できない場合、プロジェクトルートからの相対パスとして解決を試みる（`docs/` 配下のファイル内での `./docs/` 記述を許容するため）。
- **Orphan Detection**: `docs/` ディレクトリ配下に存在するすべての `.md` ファイルをリストアップし、先のエントリポイントからのトラバースツリーに含まれないファイル（孤立ファイル = Orphan）をエラーとして報告します。
- **Dead Link Detection**: リンク先のファイルパスが存在しない場合、エラーとして報告します。

## 2. 鮮度・陳腐化チェッカー (Freshness / Obsolescence Checker)

**目的**: コードベースの実態とドキュメントの記述が著しく乖離していないかを判定します。

### 検証要件
- **Last Modified Check**: `.ts` や `.tsx` などの主要なソースファイル群の最終更新日と、関連する `docs/` 側の設計ドキュメントの最終更新日を比較します。ソース全体が大きく変化しているにも関わらず、特定の設計ドキュメントが長期間（例: 半年以上）更新されていない場合、警告（Warning）を出力します。
- **AI-Driven Doc-Gardening**: 定期（例: 週1回）で実行されるCIジョブにより、LLMエージェントが `harness/knowledge/` などの主要なドキュメントと最新のコードベースを比較スキャンします。乖離を発見した場合は、自動でドキュメント修正用のプルリクエスト（PR）を作成します。

## 3. Markdown 構文・フォーマットチェッカー (Markdown Syntax & Format Checker)

**目的**: Frontmatterを含め、リンクやリスト構成がLLMパーサーにとって正しく読める、標準的でバグのないMarkdownであることを保証します。

### 検証要件
- **Linting Tool**: `markdownlint` や `remark-lint` などの標準ツールをCIに組み込みます。
- **Rules**:
  - `MD001` (Header levels should only increment by one level at a time)
  - `MD004` (Unordered list style: consistent)
  - `MD031` (Fenced code blocks should be surrounded by blank lines)
- **Frontmatter Validation**: すべてのドキュメントが適切なYAML Frontmatterを持ち、以下のLLM最適化スキーマに準拠しているかバリデーションします。

## 4. Frontmatter 構造チェッカー (Frontmatter Schema Checker)

**目的**: `docs/` 配下のすべてのMarkdownが、LLMの文脈理解に最適化された標準プロパティ（日本語による記述）を持っているか検証します。

### 検証要件
すべてのMarkdownファイルは以下のプロパティを持つYAML Frontmatterを含まなければなりません（**例外**: `AGENTS.md` はルート・`docs/` 配下を問わず Frontmatter を持たなくてよい）。
- `name` (必須): ドキュメントの一意な識別子（例: `harness-guard`）。これのみ英語/ケバブケースを許容。
- `description` (必須): ドキュメントの目的を一言で表す説明（日本語）。
- `summary` (任意推奨): ドキュメントが解決する課題や内容の要約（日本語）。
- `read_wh

[Excerpt truncated. Expand the source when this task needs more detail.]
```

### Repository Instructions

Source: `harness/policies/repository.md`
ID: `policy.repository`
Reason: pinned by role 'role.domain.repo-ops-engineer'; repository policy; required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
# Repository Instructions

This repository is a Bun + Nx monorepo for tenzyu.com products.

Use Nx as the task runner for build, test, lint, typecheck, and verify work.
Prefer `bun nx run <project>:<target>` and `bun nx affected -t <target>` over
calling underlying tools directly from the root.

Core boundaries:

- `product/apps/*` may depend on `product/packages/*`.
- `product/packages/*` must not depend on app code.
- `@tenzyu/osu-skin-core` source must stay runtime-pure and must not import DOM,
  React, Tauri, Node runtime APIs, or app packages.
- `@tenzyu/ui` must expose public components through package exports, not source
  paths.
- Web route-local `_features` code must not become a shared dependency unless it
  is promoted into `src/features` or `src/lib`.

Run before handing off broad changes:

```bash
bun run policy:deps
bun nx run-many -t check
```
```

### Git Guardrails

Source: `harness/policies/tools/git.md`
ID: `policy.tool.git`
Reason: required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
## Rules

- Check `git status --short` before mutable work.
- For non-trivial runs, use one branch and one worktree per run.
- Prefer branch names like `ai/<domain>/<task>`.
- Do not commit, amend, push, force-push, or create PRs unless the owner explicitly asks.
- Before committing, inspect status, diff, and recent log.
- Stage only intended files.
- Never commit secrets.
- Do not hide tracked changes with `skip-worktree` except for narrow temporary local config.
- Use `projectRoot/.worktrees/<task-slug>` for worktree paths; do not use `../.worktrees`.

## Standard checks

```bash
git status --short
git branch --show-current
git diff --check
```
```

### Nx Guardrails

Source: `harness/policies/tools/nx.md`
ID: `policy.tool.nx`
Reason: required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
## Rules

- Invoke Nx through Bun: `bun nx ...`.
- Prefer Nx targets over direct underlying tools.
- Use `bun nx show projects` and `bun nx show project <name> --json` to inspect configuration.
- Do not guess unfamiliar flags; check help or docs first.
- For scaffolding or generators, use the Nx generation workflow/skill first.
- Record Nx loading failures in task verification instead of silently switching tools.

## Broad Validation

For broad changes, prefer:

```bash
bun run policy:deps
bun nx run-many -t check
```
```

### Tenzyu Linter Guardrails

Source: `harness/policies/tools/tenzyu-linter.md`
ID: `policy.tool.tenzyu-linter`
Reason: required by role 'role.domain.repo-ops-engineer'

Compiled context:

```md
## Rules

- Run linter tasks through Nx when possible.
- Treat linter findings as policy boundary signals, not formatting suggestions.
- If changing rules, update the matching design rule or guardrail document.
- Do not loosen policy checks without task approval and verification.
- Record skipped linter checks in `verification.md`.
```

## Expansion Policy

Optional sources are not embedded by default. Expand only when their reason matches the concrete task.

- `harness/knowledge/incidents/README.md` - known problem or incident matched metadata signals
- `harness/knowledge/specs/docs/docs-agents-md-generator.md` - optional role knowledge matched metadata signals for intent 'Package atelier CLI with nix, expose via root flake like castalia'
- `harness/knowledge/specs/docs/docs-rename.md` - optional role knowledge matched metadata signals for intent 'Package atelier CLI with nix, expose via root flake like castalia'

Skipped sources:

- `harness/actions/phases/adr-distillation.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/knowledge-promotion.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/planning.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/review.md` - conditional workflow phase is not loaded by default
- `harness/actions/phases/worktree-isolation.md` - conditional workflow phase is not loaded by default
- `harness/knowledge/known-problems/` - optional directory or unresolved reference was not expanded
- `harness/observations/audits/` - optional directory or unresolved reference was not expanded
- `harness/policies/context-budget.md` - optional role knowledge did not match metadata signals
- `harness/runs/completed/**` - completed run history is skipped by default

## Investigation Steps

- Identify the concrete files and exported surfaces involved.
- Check whether selected constraints apply before editing.
- Record findings and any context expansion in `worklog.md`.
- Update `brief.md` or `plan.md` before expanding scope materially.

## Implementation Steps

- Keep edits scoped to the target path and assigned role boundaries.
- Preserve repository dependency boundaries and local project conventions.
- Avoid unrelated refactors.
- Record verification evidence before claiming completion.

## Verification

- `bun nx run atelier:check`
- `bun nx run atelier:build`
- `bun run policy:deps when the change is broad`

## Required Artifacts

- `brief.md`
- `context.md`
- `context.manifest.json`
- `worklog.md` for non-trivial implementation notes
- `verification.md`
- `handoff.md`

## Diagnostics

- None

## Closing Command

`atelier run close RUN-product-apps-atelier-package-atelier-cli-with-nix-expose-via--77786af952`
