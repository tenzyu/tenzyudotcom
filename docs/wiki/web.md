---
type: Playbook
title: Web correctness regressions
description: Known failure mechanisms and source-backed acceptance probes.
tags: [web, mdx, locale, osu, editor]
status: stable
sources:
  - { id: past, resource: "https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal/wiki-web-decisions.md", title: Web decisions 2026-11-13 }
  - { id: completion, resource: ../renewal/12-completion.md, title: Renewal closure }
  - { resource: ../../repo-ops/acceptance/browser-acceptance.spec.ts, title: Browser tests }
---

# Web regression reference

## MDX rendering

An article can compile yet fail when `KoFiLink` is absent from `features/blog/mdx-components.tsx`. The "a stray LLM-harness engineer" post exhibited this failure. Verify the React rendering and link output as well as MDX compilation.[^past]

## Locale redirects

Japanese is the unprefixed default, but a previously stored English cookie can override a client redirect before cookie persistence completes. The confirmed fix navigates through explicit `/ja`. `src/proxy.ts` persists the language before redirecting to its canonical URL. Test delayed cookie writes, navigation in both directions, reloads, and `html[lang]` on mobile and desktop.[^past]

## osu! styles and historical records

`bg-visualization-*` failed when colors existed only in shared CSS and Tailwind did not generate the app's utility classes. Keep the app-owned token definitions in Web CSS. Legacy osu CSS overwrote common theme variables. Check the computed color as well as whether the element exists. The 2026 tablet record lists X=127, Y=22, rotation 180°, and 400 Hz. The record for 2025 and earlier lists X=83.06 and Y=26.43. These historical display values do not establish the user's current hardware configuration.[^past]

## Scraps publication consistency

Publishing multiple GitHub content files requires one atomic ref update. Public readers must resolve the manifest, metadata and body from the same immutable commit. An independent renewal review reproduced a race between publication and updates that exposed a draft. Regression tests should exercise concurrent publication, stale-ref refusal, draft isolation and re-reading.[^completion]

## Verification scope

Unit, lint and typecheck success do not establish static page-data retrieval or browser acceptance. Browser acceptance tests Chromium at 1440 px on desktop and 390 px on mobile and records console and network events. It does not cover Firefox, WebKit or current production. If GitHub returns HTTP 403 when reading content, do not substitute invented empty data.

[^past]: Dated source record. Check the implementation before reuse.
[^completion]: This historical run does not verify subsequent commits.
