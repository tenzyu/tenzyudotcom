---
name: static-editorial-updates
description: Case record for keeping editorial pages static while still reflecting admin edits.
summary: Public editorial routes can stay static/ISR if saves explicitly revalidate affected paths instead of making page rendering dynamic.
read_when:
  - deciding whether an editorial route really needs dynamic rendering
  - designing revalidatePath or ISR behavior for admin-triggered updates
  - comparing static regeneration with request-time freshness for curated collections
skip_when:
  - you only need the repo-wide guard or placement rules; start from docs/harness/references
body_refs:
  - ./static-editorial-updates/body.md
user-invocable: false
---

./static-editorial-updates/body.md
