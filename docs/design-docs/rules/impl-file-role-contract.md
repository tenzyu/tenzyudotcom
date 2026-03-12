---
title: File Role Contract
impact: MEDIUM
impactDescription: "`*.domain.ts` などの suffix に役割を固定し、境界の読み違いを防ぐ。"
tags: architecture, dependency-inversion, naming
chapter: Implementation
---

## File Role Contract

dependency inversion を読むだけで終わらせず、file suffix でも役割を固定する。

**Avoid:**

```text
UI から *.infra.ts を直接呼ぶ
1 file の中に domain, port, infra, assemble を混ぜる
```

**Prefer:**

```text
*.domain.ts: 純粋な型とドメインルール
*.port.ts: application が依存する抽象
*.infra.ts: 外部 I/O の実装
*.assemble.ts: use case 組み立てと入力整形
```
