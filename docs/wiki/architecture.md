---
type: Reference
title: Workspace architecture
description: Executable ownership of tenzyudotcom apps, packages and routes.
tags: [architecture, bun, nx]
status: stable
sources:
  - { resource: ../../package.json, title: Root manifest }
  - { resource: ../../nx.json, title: Nx configuration }
  - { resource: ../../product/apps/web/src/features/site-navigation/public-routes.data.ts, title: Public routes }
---

# Product intent and contract-first ownership

Apps are composition roots, not the owners of reusable business rules or commodity mechanisms. A package is a capability with a manifest, explicit exports, independently executable checks and a stable dependency direction. Retain reusable capabilities even before their first product consumer; code size is not a deletion criterion.

| Classification | Owner | Public API and responsibility |
| --- | --- | --- |
| Generic | `@tenzyu/ui` `src/generic/components` | component subpaths, design tokens, upstream accessibility primitives |
| Supporting | `@tenzyu/ui` `src/supporting/components` | reusable editorial, forms, chart, navigation and other interaction patterns; existing subpath imports |
| Supporting | `@tenzyu/revisioned-content` | `/contracts`, `/github`, `/version`, `/json-document`, `/item-command`; revisioned persistence, atomic commits, conflict and uncertain-write semantics |
| Core | `@tenzyu/publishing-domain` | `/blog`, `/notes`, `/links`, `/scraps`, `/scraps-validation`, `/external-url`; framework-independent domain models and invariants |
| Core | `@tenzyu/osu-skin-core` | `/classification`, `/domain`, `/project`, `/contract`; pure skin semantics and workspace projection |
| Native boundary | Workbench Rust serde types | authoritative IPC wire schema; checked-in TS projection checked with ts-rs in native CI |
| Commodity | Bun, Nx, TypeScript, Nix, Next, React, Base UI, Storybook, Tauri, Cargo, Playwright | use native package/task/configuration APIs rather than custom orchestration |

## Product composition roots

- `product/apps/web`: Next.js route handlers, localized URL policy, presentation, content storage binding, editor authentication and cache policy. Existing public routes are blog, notes, scraps, links, tools, osu and portfolio.
- `product/apps/osu-skin-workbench`: Tauri native filesystem effects and React/Vite application; consumes pure skin projection and reusable UI.
- `product/apps/chatgpt-partial-html-export`: Firefox extension using visible DOM and Downloads or Native Messaging, not private APIs.

Apps import packages through public exports. Packages do not import apps. Generic UI runtime cannot import supporting UI runtime; stories can demonstrate both. Supporting storage cannot import publishing or Next; publishing cannot import storage or Next. App adapters bind capabilities to environment and framework services. The external `tenzyudotcom-content` repository owns authored content.

## Behavioral invariants

Preserve URL and locale contracts, authentication/origin checks, private draft isolation, immutable publication snapshots, no-force ref updates, document version conflicts and uncertain-write reconciliation. Never turn a confirmed write into a failed save due to a cache refresh. Workbench must preserve filesystem rollback, archive safety and atomic export. Browser-safe skin semantics never import native Node or Tauri APIs.

## Task ownership and evidence

Bun scripts are leaf commands; Nx expresses dependencies. `check` and `verify` are aggregates, not repeated shell pipelines. Native verification runs on its own toolchain job; Web publication and editor acceptance use isolated fixtures. `main` and `develop` are not direct work branches. Use `bun nx show project <name> --json` to inspect the resolved contract. Source-first publishing and revisioned-content libraries require no independent bundling. UI exports all 56 reusable components and retains Storybook discoverability. Static graph and test results have a revision and scope; they do not establish production or native acceptance outside the exercised environment.

The `revisioned-content/github` API owns both single-document Contents API writes (normalized content version plus blob compare-and-swap) and revisioned tree commits. The Web adapter owns Next cache tags and environment binding. The publishing-domain `/notes` API owns source normalization, parent topology validation and visible forest traversal; the Web app projects locale and URLs. Workspace project dependencies are checked using the Nx graph in CI. UI font assets are emitted as relative files referenced by the public stylesheet, rather than embedded in it.
