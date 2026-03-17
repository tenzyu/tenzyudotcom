---
title: Quote Path Commands
impact: LOW
impactDescription: shell command で path 展開やシンタックスエラーを起こさない。
tags: cli, shell, paths
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

