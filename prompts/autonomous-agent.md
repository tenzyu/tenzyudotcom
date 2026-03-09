---
name: autonomous-agent
description: ユーザーから「自立駆動して」と指示された際にエージェントが自律的にタスクを完遂しPRを作成するまでのワークフロープロンプト。
summary: "docsからのタスク読み取り、マルチエージェントの活用、developブランチを基準とした作業、そしてghによるPR作成までを全自動で行う手順。"
read_when:
  - ユーザーから「自立駆動して」「自律的に作業して」と指示された時
  - エージェントがエンドツーエンドでタスクをこなす必要がある時
skip_when:
  - 単発の質問や特定ファイルの修正のみを求められている時
user-invocable: true
---

# Autonomous Agent Workflow (自立駆動プロンプト)

ユーザーから「自立駆動して（あるいはそれに類する指示）」を与えられた場合、以下のワークフローに従って、リポジトリのドキュメントからタスクを読み取り、実装、テスト、そしてPull Requestの作成までを自律的に完遂してください。

```text
自立駆動ワークフローを開始します。以下の手順に従ってエンドツーエンドでタスクを実行してください。

## 1. タスクの認識と計画 (Research & Strategy)
- `docs/exec-plans/active/` などのディレクトリを確認し、現在進行中または次に着手すべきタスクのMarkdownファイルを読み込んでください。
- **重要**: `docs/exec-plans/**` の作業を行う際は、その知見に基づいて `prompts/*.md` や `docs/references/*.md` などのハーネス（エージェント用規律）を自動的に更新・改善してください。
- 作業内容を理解したら、現状のコードベースを `codebase_investigator` などのサブエージェントを活用して調査し、実装計画を立ててください。

## 2. ブランチの作成 (Branching)
- `git checkout develop` と `git pull origin develop` を実行し、最新の `develop` ブランチを基準にしてください。
- 作業内容に応じた適切なトピックブランチ（例: `feat/xxx`, `fix/xxx`）を `git checkout -b <branch-name>` で作成してください。

## 3. 実装と検証 (Execution & Validation)
- 計画に従ってコードを修正・追加してください。
- 修正完了後は、**必ず `bun run verify` を実行し、Lint (Code & Docs), Formatter, Tests がすべて Pass することを確認してください。**
- `scripts/lint-docs.ts` による `AGENTS.md` の到達性と Frontmatter の整合性を必ずパスさせることが「完了」の定義に含まれます。

## 4. コミットとPRの作成 (Commit & Pull Request)
- 変更内容を整理し、適切なコミットメッセージとともに `git commit` を行ってください。
- `git push -u origin <branch-name>` でリモートに変更をPushしてください。
- `docs/references/github-pr-workflow.md` の手順に従い、**必ず `gh pr create --base develop` を使用して、`develop` ブランチに向けた PR を作成してください。**
- PRが作成できたら、ユーザーにURLを共有して作業完了を報告してください。
```
