---
name: vercel-editorial-storage
description: Case record for choosing Vercel Blob as the current editorial storage backend.
summary: For self-only editorial data on Vercel, private Blob is the current first-choice store because whole-record validation and replacement fit object storage better than KV-style primitives.
read_when:
  - deciding the current storage backend for editorial source records
  - comparing Blob with KV, Edge Config, or Postgres for curated collections
  - checking when the repo should outgrow object storage
skip_when:
  - you need only the stable harness rules around source, contract, and assemble naming
body_refs:
  - ./vercel-editorial-storage/body.md
user-invocable: false
---

./vercel-editorial-storage/body.md
