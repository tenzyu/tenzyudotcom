---
okf_version: "0.2"
---

# tenzyudotcom · LLM Wiki

**Load this index first; open only relevant concepts.** This is a curated retrievable memory, not a replacement for code, tests, or authorization. Its Markdown + YAML metadata follows [Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md).

## Concepts

- [Workspace architecture](architecture.md) — owners, dependencies and routes.
- [Web correctness](web.md) — MDX, i18n, osu!, editor and regression checks.
- [Operations](operations.md) — isolated tests, CI, preview, and safety.
- [Decisions and history](decisions.md) — approved retirements, ADR retention and provenance.
- [Update log](log.md) — Dreaming changes.

## Dreaming protocol

1. Locate owning source and executable tests; classify source observation vs inference.
2. Update the smallest relevant concept, with `sources`, `status` and precise failure/acceptance conditions. Do **not** assert a `verified` event without actual revalidation.
3. Prune transient handoffs and duplicate narration, retain immutable ADRs, unresolved hazards and restore anchors.
4. Original evidence is recoverable from the [pre-compaction `develop` snapshot](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal). A `stable` concept means consumable documentation, **not** a currently healthy server.
