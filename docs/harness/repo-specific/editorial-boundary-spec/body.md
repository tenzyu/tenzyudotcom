# Editorial Boundary Spec

## Boundary Summary

### Source

- human-authored canonical data
- not UI-ready by itself
- may later live in Blob / DB / API

### Content

- Intlayer meaning only
- page / feature の fixed copy
- source record や fetch input を持たない

### Contract

- source / URL / env / external input を app が信頼できる shape に落とす
- parse / normalize / validate
- view model assembly まではしない

### Assemble

- source / content / external fetch を束ねて page / feature data を作る
- raw input validation を ad-hoc に再実装しない

### Storage

- source を読む shared helper
- canonical source の代わりではない

## Failure Policy

- not-found -> fallback 可
- invalid-data -> fail closed
- outage / token misconfig -> fail closed
- save conflict -> reject and reload

## Interview Triggers

次のどれかが未設計なら、実装前にインタビューする。

- route placement
- primary nav exposure
- source shape
- auth model
- storage model
- publish / draft semantics
- fallback / failure policy
- auto-enrichment policy
