---
okf_version: "0.2"
---

# tenzyudotcom knowledge index

Use this index to find the relevant concept files. The files do not replace code, tests, or authorization. The Markdown and YAML metadata follow [Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md).

## Reference and playbooks

- [Workspace architecture](architecture.md) lists owners, dependencies and routes.
- [Web correctness](web.md) documents MDX, i18n, osu!, editor behavior and regression checks.
- [Operations](operations.md) documents isolated tests, CI, preview and safety.
- [Decisions and history](decisions.md) records approved retirements, ADR retention and provenance.
- [Update log](log.md) records Dreaming changes.

## Knowledge update procedure

1. Locate the responsible source code and executable tests. Distinguish source observations from inferences.
2. Update the smallest relevant concept file. Include `sources`, `status`, and precise failure and acceptance conditions. Do not assert a `verified` event without revalidation.
3. Remove transient handoffs and duplicate narration. Retain immutable ADRs, unresolved hazards, and recovery references.
4. Original evidence is recoverable from the [pre-compaction `develop` snapshot](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal). A `stable` concept is ready for use as documentation. Its status does not establish that the server is currently healthy.
