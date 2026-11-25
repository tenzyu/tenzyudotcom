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

# MDX rendering

An article can compile yet fail when `KoFiLink` is absent from `features/blog/mdx-components.tsx`. That failure was observed in the “a stray LLM-harness engineer” post: validate actual React render and link output as well as MDX compilation.[^past]

# Locale

Japanese is the unprefixed default, but a previously stored English cookie can override a client redirect before cookie persistence completes. The confirmed fix navigates through explicit `/ja`; `src/proxy.ts` persists the language before redirecting to its canonical URL. Test delayed-cookie writes, round trip, reload, `html[lang]` and mobile/desktop.[^past]

# osu! styles and historical records

`bg-visualization-*` failed when colors existed only in shared CSS and Tailwind did not generate the app's utility classes. Keep the app-owned token definitions in Web CSS. Legacy osu CSS overwrote common theme variables; verify computed color, not just element presence. The dated 2026 tablet setting record was X=127, Y=22, rotation 180°, 400 Hz; 2025 and earlier X=83.06/Y=26.43. These are **historical display values**, not claims about the user's current hardware configuration.[^past]

# Scraps consistency

Publishing multiple GitHub content files requires one atomic ref update; public readers must resolve manifest, metadata and body from the **same immutable commit**. An independent renewal review previously reproduced a publish/update race exposing a draft; regression tests should exercise concurrent publication, stale-ref refusal, draft isolation and re-read.[^completion]

# Evidence threshold

Unit, lint and typecheck success do not establish static page-data retrieval or browser acceptance. Browser acceptance covers Chromium desktop 1440px/mobile 390px with console/network observations; not Firefox/WebKit or current production. A 403 from content GitHub must not be concealed with invented empty data.

[^past]: Dated source record, check implementation before reuse.
[^completion]: Historical run, not verification of subsequent commits.
