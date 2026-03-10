---
title: "Dependency Inversion Pattern"
impact: MEDIUM
impactDescription: ロジックを外部実装（API, DB）から保護し、テストの容易性と交換可能性を高める。
tags: architecture, pattern, types
chapter: Foundations
---

# Dependency Inversion Pattern

UI や mount point、外部ツールの都合に引きずられず、どこがロジックと状態と知識を所有するかを明確に分離する。

**Incorrect:**

```tsx
// UI コンポーネントの中で直接取得・保存・バリデーション等を行う
async function Component() {
  const data = await db.fetch({id:1}).then((res) => schema.parse(res))
  return <div>{data.name}</div>;
}
```

**Correct:**

- `*.domain.ts`: 純粋な型とドメインルール。
- `*.port.ts`: application が依存する抽象化インターフェース。
- `*.contract.ts`: infrastructure外部システムとの境界実装。port を実装し、外部 I/O の取得・保存・境界バリデーションを担う。
- `*.assemble.ts`: application 層。複数の contract / source を組み合わせ、UI や use case に適した形へ整える。

UI や application は具体実装ではなく `*.port.ts` に依存し、`*.contract.ts` がそれを実装する。

```tsx
// *.domain.ts
export type User = {
  id: string;
  name: string;
}

// *.port.ts
export interface UserRepository {
  save(user: User): Promise<User>;
}

// *.contract.ts
export class PostgresUserRepository implements UserRepository {
  async save(user: User) { /* 外部DB保存 */ }
}

// *.assemble.ts
class SaveUserUseCase {
  constructor(repository: UserRepository) {}
  async execute(raw_user): Promise<User> {
    // アプリケーションルール
    return this.repository.save(user)
  }
}

export function makeSaveUserUseCase() {
  return new SaveUserUseCase(new PostgresUserRepository())
}
```

**Usage:**

```tsx
export async function Component(){
  const saveUseCase = makeSaveUserUseCase()
  const user = await saveUseCase.execute({id:1,name:'tenzyu'})
  return <div>{user.name}</div>
}
```
