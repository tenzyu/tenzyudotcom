---
title: "Memory Layers & Persistence"
impact: MEDIUM
impactDescription: 情報を適切な寿命と場所に保存し、コンテキストの汚染と忘却を防ぐ。
tags: memory, harness, documentation
chapter: Intelligence
---

# Memory Layers & Persistence

情報の性質に応じて寿命と保存先を分ける。

1. **Session**: 作業中のみ。完了後に捨てる（いま触っているファイル等）。
2. **Repo/Structural**: `AGENTS.md` やフォルダ構造自体。常に読み直す。
3. **Durable**: `design-docs` (ルール) と `exec-plans/completed` (具体的な成功・失敗事例)。

**Incorrect:**

```text
// 恒久的なルールを一時的な TODO コメントとして放置する
// 過去の失敗事例をドキュメントに残さず、次のセッションで同じミスをする
```

**Correct:**

```text
// 複数箇所で再発した曖昧さは design-docs にルールとして昇格させる
// 今回のタスクで得た具体的な教訓は completed ログに残す
```
