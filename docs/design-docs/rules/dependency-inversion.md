---
title: "Dependency Inversion Pattern"
impact: MEDIUM
impactDescription: ロジックを外部実装（API, DB）から保護し、テストの容易性と交換可能性を高める。
tags: architecture, pattern, types
chapter: Foundations
---

# Dependency Inversion Pattern

mount point や外部ツールに惑わされず、どこがロジックと状態と知識を所有するかを明確に分離する。

- `*.domain.ts`: 純粋な型とドメインルール。
- `*.port.ts`: 抽象化インターフェース。
- `*.contract.ts`: 境界（外部実装との接続点）の定義とバリデーション。infrastructure
- `*.assemble.ts`: 複数のデータソースを結合し、UI に適した形状に組み立てる。application

**Incorrect:**

```tsx
// UI コンポーネントの中で直接 API のレスポンス形状に依存している
export default function Component() {
  const data = await fetch('/api/raw-data');
  return <div>{data.raw_field_name}</div>;
}
```

**Correct:**

```tsx
// 境界（Contract）でパースし、ドメインモデルへ変換してから UI に渡す
const data = MyContract.parse(await fetch('/api/raw-data'));
return <Presentation item={data} />;
```
