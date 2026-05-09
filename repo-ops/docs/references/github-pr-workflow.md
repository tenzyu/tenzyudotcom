---
name: harness-github-pr-workflow
description: GitHub CLI (gh) を用いた develop 向けPR作成とレビューの標準フロー定義。
summary: サブエージェントが自身の task branch を push し、`develop` を base にした PR を作成してメインエージェントと人間へレビュー依頼する手順。
read_when:
  - 機能の実装やバグ修正が完了し、ユーザーへ変更内容をPRとして提出する時
  - 差分のチェックやコードレビューのプロセスを行う時
skip_when:
  - まだ作業の初期〜中期段階であり、ローカルでの検証が終わっていない時
user-invocable: false
---

# GitHub PR Workflow (gh integration)

このドキュメントは、サブエージェントがターミナル上で `gh` コマンドを用いて、自身の task branch から `develop` 向けの Pull Request（PR）を作成し、メインエージェントと人間へレビューを渡すための標準手順を定義します。

## 1. 前提条件の確認
- `gh auth status` を実行し、GitHub CLI が認証済みであることを確認します。
- 作業用トピックブランチが **必ず `develop` ブランチから派生していること** を確認します。
  - `git branch --show-current` でトピックブランチにいることを確認。
  - `git log develop..HEAD` などで差分を確認し、意図しないブランチ（`main`など）が混じっていないかチェックします。
- **必ず `bun run verify` を実行し、すべてのチェック（Lint, Docs, Tests）が Pass していること** を最終確認します。
- 変更がすべて Commit されていることを `git status` で確認します。
- 対象の `docs/exec-plans/active/*.md` に書かれた完了条件を満たしていることを確認します。

## 2. セルフチェック (Self-Review Checklist)
PR作成前に、サブエージェントは以下の項目を自問自答してください。
1. **マージ先は `develop` になっているか？** (デフォルトが `main` になっている場合があるため、明示的に `--base develop` を指定すること)
2. `bun run lint:docs` は最新の `AGENTS.md` の整合性をパスしているか？
3. 新しいドキュメントを追加した場合、`AGENTS.md` からの到達性は確保されているか？

## 3. ブランチのPushとPull Request の作成
作業中のトピックブランチをリモートにPushした上で、以下のコマンドを使用して PR を作成します。**マージ先（ベースブランチ）は常に `develop` です。**

```bash
# 1. まず現在のブランチをリモートにPushする
git push -u origin $(git branch --show-current)

# 2. タイトルとサマリー（Body）を指定してPRを作成
# マージ先を明示的に --base develop と指定することを絶対に忘れないでください。
gh pr create --base develop --title "feat: [簡潔な作業タイトル]" --body "PRの目的と変更内容のサマリー"
```

エラーや競合（Conflict）が発生した場合は、ターミナルからの出力を解析し、必要に応じて `git pull` 等で解決を図ります。
競合解消が task scope を超える場合は、独断で進めずメインエージェントへ返す。

## 4. セルフレビューと CI チェック
- `gh pr checks` を使用して、リモートの CI (GitHub Actions 等）がPassしたかどうかのステータスを確認できます。
- `gh pr view` を用いて、作成されたPRのURLを取得し、メインエージェントへ返します。
- メインエージェントは複数 PR の依存関係、レビュー順、統合順を整理してユーザーへ報告します。
