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

Apps compose libraries. Reusable business rules and commodity mechanisms belong in packages. Each package has a manifest, explicit exports, checks that can run independently and a stable dependency direction. Retain reusable packages even before the first product uses them. Code size alone is not a deletion criterion.

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
- `product/apps/osu-skin-workbench`: Tauri native filesystem operations and a React/Vite application. Imports pure skin projection and reusable UI.
- `product/apps/chatgpt-partial-html-export`: Firefox extension that reads the visible DOM and writes via Downloads or Native Messaging. It does not use private APIs.

Apps import packages through public exports. Packages do not import apps. Generic UI runtime cannot import supporting UI runtime. Stories can demonstrate both. Supporting storage cannot import publishing or Next. Publishing cannot import storage or Next. App adapters bind capabilities to environment and framework services. The external `tenzyudotcom-content` repository owns authored content.

## Behavioral invariants

Preserve URL and locale contracts, authentication/origin checks, private draft isolation, immutable publication snapshots, no-force ref updates, document version conflicts and uncertain-write reconciliation. Never turn a confirmed write into a failed save due to a cache refresh. Workbench must preserve filesystem rollback, archive safety and atomic export. Browser-safe skin semantics never import native Node or Tauri APIs.

## Task ownership and evidence

Bun scripts are leaf commands. Nx declares task dependencies. The `check` and `verify` targets aggregate existing tasks instead of repeating shell pipelines. Native verification runs on its own toolchain job; Web publication and editor acceptance use isolated fixtures. `main` and `develop` are not direct work branches. Use `bun nx show project <name> --json` to inspect the resolved contract. Source-first publishing and revisioned-content libraries require no independent bundling. UI exports all 56 reusable components and retains Storybook discoverability. Static graph and test results apply to a specific revision and scope. They do not establish production or native acceptance outside the tested environment.

The `revisioned-content/github` API owns both single-document Contents API writes (normalized content version plus blob compare-and-swap) and revisioned tree commits. The Web adapter owns Next cache tags and environment binding. The publishing-domain `/notes` API implements source normalization, parent topology validation and visible forest traversal. The Web app projects locale and URLs. CI checks workspace project dependencies using the Nx graph. The UI build emits font assets as relative files and references them in the public stylesheet instead of embedding them.
