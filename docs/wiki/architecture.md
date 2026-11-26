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

# Workspace architecture

Apps compose libraries. Packages contain reusable business rules and shared technical mechanisms. Each package has a manifest, explicit exports, checks that can run independently and a stable dependency direction. Reusable packages can exist before the first product uses them. Code size alone does not justify deletion.

| Classification | Owner | Public API and responsibility |
| --- | --- | --- |
| Generic | `@tenzyu/ui` `src/generic/components` | Component subpaths, design tokens, and upstream accessibility components |
| Supporting | `@tenzyu/ui` `src/supporting/components` | Reusable editorial, form, chart, navigation, and other interaction patterns. Existing subpath imports remain available. |
| Supporting | `@tenzyu/revisioned-content` | `/contracts`, `/github`, `/version`, `/json-document`, `/item-command`. Revisioned persistence, atomic commits, conflict handling, and uncertain-write handling. |
| Core | `@tenzyu/publishing-domain` | `/blog`, `/notes`, `/links`, `/scraps`, `/scraps-validation`, `/external-url`. Framework-independent domain models and invariants. |
| Core | `@tenzyu/osu-skin-core` | `/classification`, `/domain`, `/project`, `/contract`. Pure skin semantics and workspace projection. |
| Native boundary | Workbench Rust serde types | Authoritative IPC wire schema. Native CI checks the committed TypeScript projection with `ts-rs`. |
| Commodity | Bun, Nx, TypeScript, Nix, Next, React, Base UI, Storybook, Tauri, Cargo, Playwright | Native package, task, and configuration APIs replace custom orchestration. |

## Applications

- `product/apps/web`: Next.js route handlers, localized URL policy, presentation, content storage binding, editor authentication and cache policy. Existing public routes are blog, notes, scraps, links, tools, osu and portfolio.
- `product/apps/osu-skin-workbench`: Tauri native filesystem operations and a React/Vite application. Imports pure skin projection and reusable UI.
- `product/apps/chatgpt-partial-html-export`: Firefox extension that reads the visible DOM and writes via Downloads or Native Messaging. It does not use private APIs.

Apps import packages through public exports. Packages do not import apps. Generic UI runtime cannot import supporting UI runtime. Stories can demonstrate both. Supporting storage cannot import publishing or Next. Publishing cannot import storage or Next. App adapters bind capabilities to environment and framework services. The external `tenzyudotcom-content` repository owns authored content.

## Runtime contracts

The runtime contracts cover URLs, locale, authentication and origin checks, private draft isolation, immutable publication snapshots, ref updates without force, document version conflicts, and uncertain-write reconciliation. A cache refresh failure must not report a confirmed write as a failed save. Workbench must preserve filesystem rollback, archive safety, and atomic export. Browser-safe skin semantics never import native Node or Tauri APIs.

## Tasks and verification

Bun scripts are leaf commands. Nx declares task dependencies. The `check` and `verify` targets aggregate existing tasks instead of repeating shell pipelines. Native verification runs in a separate CI job with its own toolchain. Web publication and editor acceptance use isolated fixtures. `main` and `develop` are not direct work branches. To inspect the resolved project configuration, run `bun nx show project <name> --json`. Source-first publishing and revisioned-content libraries require no independent bundling. The UI package provides 56 component subpath exports and Storybook stories. To count the component subpaths from the repository root, run `node -p 'Object.keys(require("./product/packages/ui/package.json").exports).filter(k => k !== "." && k !== "./styles.css").length'`. Static graph and test results apply to a specific revision and scope. They do not establish production or native acceptance outside the tested environment.

The `revisioned-content/github` API owns both single-document Contents API writes (normalized content version plus blob compare-and-swap) and revisioned tree commits. The Web adapter owns Next cache tags and environment binding. The publishing-domain `/notes` API implements source normalization, parent topology validation and visible forest traversal. The Web app projects locale and URLs. CI checks workspace project dependencies using the Nx graph. The UI build emits font assets as relative files and references them in the public stylesheet instead of embedding them.
