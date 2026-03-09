---
name: editorial-boundary-spec
description: editorialサブシステムのための、リポジトリ固有の障害ポリシー。
summary: editorialの読み書きに対するリポジトリ固有の障害ポリシーを記録する。一般的な境界の語彙とインタビュートリガーはharnessの参照に存在する。
read_when:
  - editorialサブシステム内の責任を明確にする時
  - editorialの読み書きに対する障害発生時の動作を決定する時
  - editorialの読み書きに対するリポジトリ固有のフォールバック動作を確認する時
skip_when:
  - サイト全体のharnessのガードレールや構造ルールだけが必要な時
user-invocable: false
---

# Editorial Boundary Spec

## Scope

`source / content / contract / assemble / storage` の一般語彙は
`docs/design-docs/tools-boundary.md` を正とする。

この文書には、この repo の editorial subsystem に固有な
failure policy だけを残す。

## Failure Policy

- not-found -> fallback 可
- invalid-data -> fail closed
- outage / token misconfig -> fail closed
- save conflict -> reject and reload
