---
name: harness-github-pr-workflow
description: GitHub CLI (gh) を用いたPR作成とレビューの標準フロー定義。
summary: エージェントが作業後に自身の差分をチェックし、自己生成したwalkthrough.mdをPRの概要に流し込んで人間へレビュー依頼する手順。
read_when:
  - 機能の実装やバグ修正が完了し、ユーザーへ変更内容をPRとして提出する時
  - 差分のチェックやコードレビューのプロセスを行う時
skip_when:
  - まだ作業の初期〜中期段階であり、ローカルでの検証が終わっていない時
user-invocable: false
---

# GitHub PR Workflow (gh integration)

このドキュメントは、エージェントがターミナル上で `gh` コマンドを用いて、自己生成したコードの Pull Request（PR）を作成し、人間にレビューを依頼するための標準的な作業手順を定義します。これは「小さく始める Harness Engineering」における自己改善・提案ループの第一歩です。

## 1. 前提条件の確認
- `gh auth status` を実行し、GitHub CLI が認証済みであることを確認します。（未認証の場合は `gh auth login` の手順をユーザーに依頼、または環境変数の確認をします）
- カレントブランチが作業用のトピックブランチであることを `git branch --show-current` で確認します。（開発の基準となるベースブランチは `develop` です。原則として `develop` から派生したトピックブランチからPRを作成します）
- 変更がすべて Commit されていることを `git status` で確認します。

## 2. 変更内容のサマリー生成
- 作業の集大成として作成された `walkthrough.md` などのアーティファクト、もしくは独自のタスクサマリーを読み直します。
- どのような「Why（なぜこの変更が必要だったか）」と「How（どのように修正したか）」が含まれているか短くマークダウンでまとめます。

## 3. ブランチのPushとPull Request の作成
作業中のトピックブランチをリモートにPushした上で、以下のコマンドを使用して PR を作成します。基準となるベースブランチは原則として `develop` とします。

```bash
# 1. まず現在のブランチをリモートにPushする
git push -u origin $(git branch --show-current)

# 2. タイトルと、生成したサマリー（Body）を指定してPRを作成
# ベースブランチを明示的に --base develop と指定します
gh pr create --base develop --title "feat: [簡潔な作業タイトル]" --body "$(cat /path/to/walkthrough.md)"
```

エラーや競合（Conflict）が発生した場合は、ターミナルからの出力を解析し、必要に応じて `git pull` 等で解決を図ります。

## 4. セルフレビューと CI チェック
- `gh pr checks` を使用して、リモートの CI (GitHub Actions 等）がPassしたかどうかのステータスを確認できます。
- `gh pr view` を用いて、作成されたPRのURLを取得し、ユーザー（人間）に「レビュー待ち」であることを通知（Notify User）します。
