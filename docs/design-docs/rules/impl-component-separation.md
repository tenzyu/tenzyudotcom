---
title: Component Separation
impact: HIGH
impactDescription: dirty component を放置せず、logic と presentation を分けて保守性を守る。
tags: logic, presentation, refactor
chapter: Implementation
---

## Component Separation

1 file に副作用、取得、DOM 監視、見た目を混ぜた dirty component を許容しない。  
logic は hook や helper へ出し、presentation は見た目に専念させる。

**Avoid:**

```tsx
export default function DirtyComponent() {
  const [state, setState] = useState(0)
  useEffect(() => { /* complex DOM watch */ }, [])
  return <div style={{ color: "red" }}>{state}</div>
}
```

**Prefer:**

```tsx
export default function CleanComponent() {
  const { data } = useResource()
  return <PresentationalView data={data} />
}
```

