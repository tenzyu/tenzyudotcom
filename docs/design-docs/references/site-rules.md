---
title: Site Rules Repair Guide
impact: HIGH
impactDescription: lint-site-rules の各違反を rule 名へ対応付け、修正時の読み直しコストを減らす。
tags: reference, lint, site-rules
chapter: References
---

## Site Rules Repair Guide

`lint-site-rules` は repo 固有の owner 境界を見ている。違反 kind ごとに読む rule を固定する。

**Map:**

```text
middleware-file -> security-proxy-boundary.md
server-action-auth -> security-server-actions-require-auth-even-for-helper-actions.md
editor-collection-registry -> editor-collection-registration-contract.md
descriptor-owner -> security-editor-session-boundary.md
storage-owner -> security-editor-write-safety.md
zod-owner -> impl-parse-dont-validate-boundaries.md
next-server-api-owner -> security-proxy-boundary.md
```

