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

# Implemented boundaries

`product/apps/web` uses Next.js 16, React, Intlayer, MDX and the public routes **blog, notes, scraps, links, tools, osu, portfolio**. Do not follow the older proposed `/engineering` route as if implemented. The route registry and `src/config/site-policy.ts` govern links and sitemap.

`product/apps/osu-skin-workbench` uses Tauri/Rust for native filesystem effects and React/Vite for UI. `product/packages/osu-skin-core` retains runtime-pure contracts/classification. `product/packages/ui` owns shareable presentation/Storybook. `repo-ops` is tooling, not a product runtime dependency. Apps may import packages; packages must not import apps.

`product/apps/chatgpt-partial-html-export` reads visible Firefox page DOM and exports local HTML through Downloads or Native Messaging, **not** private ChatGPT APIs.

# Web domain ownership

`src/app` owns Next.js routing, HTTP adapters, layouts and route composition. The following product capabilities have a single implementation owner:

| Owner | Responsibilities |
| --- | --- |
| `features/blog` | Article metadata, source, catalog, aliases, public UI, authoring commands, editor validation and publication tests |
| `features/notes` | Note identities, thread invariants, public views, item commands and editor |
| `features/scraps` | Manifest, entry, translation and visibility rules, public views, editor and aggregate publication |
| `features/links` | Link validation, short-link behavior, public projections, item commands, editor and cache invalidation |
| `features/osu` | Profile, API access, settings history, embedded media and presentation |
| `features/content-editor` | Shared editor UI, login, collection dispatch and navigation; not Blog/Scraps authoring policy |
| `platform/content-store` | Revisioned snapshots, tree commits, reconciliation, JSON document operations and transport errors |
| `config/content-cache.ts` | Application-owned pathname-to-cache-tag integration policy |

Blog consumes the structural `RevisionedContentRepository` capability; the GitHub adapter implements it. Scraps keeps the narrower aggregate contract; Notes and Links retain document-level version checks. The platform is not an owner of Blog aliases, Scrap visibility, note threads, link ordering, or Next route paths.

Use immutable publication snapshots for routes that already require request-time revision consistency. The osu profile's existing cached Links projection remains an explicit Links API; its ISR behavior is not changed by this refactor. Preserve private draft isolation, no-force ref updates, version conflicts, uncertain publication reconciliation, metadata/source fidelity and existing URL contracts. No content migration is required.

Other features (including home, portfolio, tools, shell and authentication) still use their existing layout. Do not infer that every route-local module is obsolete or that the complete dependency graph has been proven acyclic. CI acceptance remains required.

# Architecture checks

The bespoke architecture linter is retired. Use TypeScript, Biome, the dependency policy, code review and behavioral tests. Authentication, origin checks, private draft isolation and publication consistency remain requirements.

# Where to start

Inspect `package.json`, `nx.json`, `product/apps/*/project.json` and `bun nx show project <name> --json`. Active Nix shells: default/web, minimal, skin-workbench, browser-verification and repo-ops. If direnv already loaded the shell, don't repeatedly invoke Nix.

The separate `tenzyudotcom-content` repository owns authored content. An external read failure cannot be silently replaced with empty data. Historical host/preview records are not current configuration.
