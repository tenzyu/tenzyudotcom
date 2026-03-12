---
title: "Verification Guard"
impact: CRITICAL
impactDescription: デプロイ不可能なコードの混入を防ぎ、変更の正しさを客観的に証明する。
tags: verification, test, ci
chapter: Security & Safety
---

# Verification Guard

全ての変更は、実行可能な検証（Verification）を最低 1 つは通さなければならない。

**Avoid:**

- 「コードを書いたので完了です」と報告し、一度もビルドやテストを走らせない
- エラーが出ているが「手元の環境では動く」として無視する

**Prefer:**

- **Build/Lint**: ランタイムやデータフローを触ったら `build`、構文や config を触ったら `lint` を通す。
- **Tests**: 影響範囲に応じたテストを実行する。特に正規化や複雑なロジックを触った場合はテスト追加を優先する。
- **Nix Entry**: `nix develop -c <command>` を標準の検証入り口として使用し、環境差異を排除する。