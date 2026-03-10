---
title: docs-rename
description: ドキュメントの移動と参照の自動更新を行うスクリプトの仕様。
---

# Docs Rename Spec

## Goal
ドキュメントの移動・リネームを行い、プロジェクト内の参照（Markdownリンクおよび @docs メンション）を自動更新する。

## Requirements
- **対象範囲**: `docs/` および `src/` 配下のファイルをスキャンして参照を更新する。
- **補完**: `docs/` 配下の既存パスを `<old>` として、`<old>` の親ディレクトリを `<new>` の候補として補完する。
- **シェル対応**: Zsh および Bash。`flake.nix` の `shellHook` で有効化する。
- **存在しないパスの許容**: `<old>` が存在しない場合も警告を出しつつ参照置換を実行する。

## Technical Strategy
- `scripts/docs-rename.ts`: 本体。`parseArgs` で引数とフラグを処理。
- `scripts/completion.sh`: シェル補完定義。
- `--list-completions <prefix>`, `--list-directories`: 補完用の隠しフラグ。

## Reference Update Logic
### 1. Matchers
- **@docs Mentions**: `@docs/path/to/file` (拡張子なし/あり両対応)。
- **Markdown Links**: `[text](path)` 形式。外部URL、ハッシュリンク、`/docs/` 以外の `src` 参照などは除外。

### 2. Path Resolution
- **Relative Fallback**: ファイルが `docs/` 内にあるのに `./docs/` で始まるリンク（技術的に壊れたリンク）がある場合、プロジェクトルートからのパスとしてフォールバック解決を試みる。
- **Directory Mapping**: ディレクトリ自体を移動する場合、その配下の全てのパスに対して前方一致（Prefix matching）で置換を行う。
- **Trailing Slashes**: Markdownリンクにおいて、元のリンクに末尾スラッシュがある場合は置換後も維持する。

### 3. Extension Management
- 置換前のリンクが `.md` を含んでいた場合は置換後も付与し、含んでいなかった場合は除去する。
- ただし、移動先が `.md` ファイルでない場合は、元の形式にかかわらず実際の拡張子に従う。

## Commands
- `bun run docs-rename <old> <new>`: 実行
- `bun run docs-rename <old> <new> --dry-run`: 変更内容のプレビュー
