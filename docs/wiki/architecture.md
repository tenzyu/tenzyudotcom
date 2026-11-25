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

# Web ownership transition

The target is a feature-oriented modular monolith: `src/app` owns framework routes and composition, `src/features/<feature>` owns product behavior, and a shared technical layer owns storage/auth/locale/URL capabilities. Links and Notes public and editor implementations now live in `src/features/links` and `src/features/notes`; contextual editor UI lives in `src/features/content-editor/ui`. Other features and shared infrastructure still use their incumbent paths pending migration. Keep route URLs and content schemas unchanged; do not introduce a mandatory domain/port/adapter hierarchy. This transition is not proof that CI passed.

# Architecture checks

The bespoke architecture linter is retired. Use TypeScript, Biome, the dependency policy, code review and behavioral tests. Authentication, origin checks, private draft isolation and publication consistency remain requirements.

# Where to start

Inspect `package.json`, `nx.json`, `product/apps/*/project.json` and `bun nx show project <name> --json`. Active Nix shells: default/web, minimal, skin-workbench, browser-verification and repo-ops. If direnv already loaded the shell, don't repeatedly invoke Nix.

The separate `tenzyudotcom-content` repository owns authored content. An external read failure cannot be silently replaced with empty data. Historical host/preview records are not current configuration.
