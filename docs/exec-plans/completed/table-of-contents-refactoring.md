---
name: table-of-contents-refactoring
description: Case study on refactoring "dirty" UI code into a well-structured component.
summary: Documents the transition of a complex, inline-styled TableOfContents into a clean, reusable feature component using a design token-first approach.
read_when:
  - refactoring complex, legacy, or dirty React components
  - cleaning up excessively nested logic inside a component
  - applying the site's authoring guidelines to existing code
skip_when:
  - you are creating a new, simple UI component from scratch
user-invocable: false
---

# Refactoring: Table of Contents Component

## The Situation

以前、`src/app/[locale]/(main)/archives/osu-profile/_components/table-of-contents.tsx` などのコンポーネントにおいて、「dirty code」と称されるような可読性の低い複雑な実装が存在していた。
具体的には、状態管理、DOM要素の監視（IntersectionObserver）、スクロールロジック、インラインスタイルや散在するクラスが１つの巨大なコンポーネントに混ざり合っていた。

## The Solution / Current Precedent

「Component Authoring Skill」の方針に従い、これらをクリーンで保守性の高いアーキテクチャへとリファクタリングする。

### Actions & Guardrails

- **Separation of Concerns**: IntersectionObserver を使用するロジックはカスタムフック (`useActiveHeadline` 等) として切り出すこと。
- **Token-first Styling**: マジックナンバーやハードコードされた色・余白スタイルを避け、TailwindCSS を通して一貫したカラースキームやタイポグラフィのクラス（トークン）を適用すること。
- **Component File Placement**: ページ固有のコンポーネントであるため `_components` または `_features` の中に閉じ込め、他の場所から不必要にインポートされることを防ぐ。
- **Do NOT**: 「動いているから」という理由で、1ファイル100行を超えるような多すぎる責務を持つ巨大コンポーネントを維持しないこと。発見次第、小さな関数コンポーネントとカスタムフックへ分割すること。

## Precedent Stop Declaration

LLM は、他のファイルに「dirty」な実装が残っていたとしても、**それをコーディングの参考にはせず、このリファクタリングケースでのクリーンアーキテクチャ・責務分割方針を Precedent とすること**。既存の負債を拡張させないこと。
