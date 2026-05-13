---
title: UI Package Boundary Repair Guide
impact: HIGH
impactDescription: "@tenzyu/ui の責務境界と Storybook 検証面を短く参照できるようにする。"
tags: reference, ui, package-boundary
chapter: References
---

# @tenzyu/ui package boundary

`@tenzyu/ui` is the shared design-system package for React consumers in tenzyudotcom.

## Owned by @tenzyu/ui

- React primitive UI components
- Design tokens and CSS custom properties
- Browser/WebView normalization
- Component variant vocabulary
- Storybook catalog and component quality checks

## Not owned by @tenzyu/ui

- Web page layout
- Workbench application layout
- Route-specific classes
- App-specific animation
- One-off product overrides
- Next.js routing, Tauri commands, or domain-specific behavior

## Storybook contract

Every primitive component must be represented in the Storybook catalog. Storybook is not merely a gallery. It is the review surface for:

- variants
- sizes
- component states
- accessibility expectations
- cross-theme behavior
- composition boundaries

The canonical category prefix is `Design System/`.

## Variant policy

Variants must be reusable UI concepts. Product-specific concepts are forbidden.

Allowed examples:

- `default`
- `primary`
- `secondary`
- `tertiary`
- `outline`
- `soft`
- `ghost`
- `link`
- `destructive`
- `warning`
- `success`
- `info`

Forbidden examples:

- `workbench`
- `editor`
- `blog`
- `osu`
- `landing`
- `admin`

Product-specific presentation should compose primitives in the owning app.
