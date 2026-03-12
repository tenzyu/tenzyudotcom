---
title: Dependency Inversion
impact: HIGH
impactDescription: UI と mount point から具体実装を剥がし、交換可能な境界を保つ。
tags: architecture, dependency-inversion, ports
chapter: Foundations
---

## Dependency Inversion

UI や application は具体実装ではなく port に依存し、infra がそれを実装する。  
取得、保存、検証、整形を UI へ押し込まない。

**Avoid:**

```tsx
async function Component() {
  const data = await db.fetch({ id: 1 }).then((res) => schema.parse(res))
  return <div>{data.name}</div>
}
```

**Prefer:**

```tsx
export interface UserRepository {
  save(user: User): Promise<User>
}

export function makeSaveUserUseCase() {
  return new SaveUserUseCase(new PostgresUserRepository())
}
```

