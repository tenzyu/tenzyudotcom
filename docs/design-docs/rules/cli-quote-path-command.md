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
```

**Prefer:**

```bash
nix develop -c mv "src/app/[locale]/(main)/hoge/_features/fuga.domain.ts" "src/lib/hoge/fuga.domain.ts"
```

