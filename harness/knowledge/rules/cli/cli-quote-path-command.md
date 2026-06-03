---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.cli.quote-path-command
title: Quote Path Commands
status: active
tags:
  - cli
  - shell
  - paths
  - domain:cli
  - subject:naming
  - kind:rule
  - criticality:low
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: shell command で path 展開やシンタックスエラーを起こさない。
    chapter: CLI
---

## Quote Path Commands

shell で path を渡すときは quote する。

**Avoid:**

```bash
nix develop -c mv src/app/[locale]/(main)/hoge/_features/fuga.domain.ts src/lib/hoge/fuga.domain.ts
sed -n '1,260p' packages/site/src/app/[locale]/(main)/puzzles/_features/puzzles.infra.ts
```

**Prefer:**

```bash
nix develop -c mv "src/app/[locale]/(main)/hoge/_features/fuga.domain.ts" "src/lib/hoge/fuga.domain.ts"
sed -n '1,260p' 'packages/site/src/app/[locale]/(main)/puzzles/_features/puzzles.infra.ts'
```
