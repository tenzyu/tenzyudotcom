---
title: "Quote the Path when you Use Commands"
impact: LOW
impactDescription: brief description of impact
tags: composition, components
chapter: CLI
---

# Quote the Path on Commands

bash でシンタックスエラーを出さないことを徹底する。

**Incorrect:**

```tsx
nix develop -c mv src/app/[locale]/(main)/hoge/_features/fuga.domain.ts src/lib/hoge/fuga.domain.ts
```

**Correct:**

```tsx
nix develop -c mv "src/app/[locale]/(main)/hoge/_features/fuga.domain.ts" "src/lib/hoge/fuga.domain.ts"
```
