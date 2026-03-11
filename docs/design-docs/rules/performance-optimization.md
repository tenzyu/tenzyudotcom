---
title: "Performance Optimization"
impact: HIGH
impactDescription: 初期ロードの高速化と、インタラクションの応答性を限界まで高める。
tags: performance, nextjs, bundle
chapter: Implementation
---

# Performance Optimization

フロントエンドのパフォーマンスを最適化するために、ウォーターフォールの排除、バンドルサイズの抑制、不要な再レンダリングの抑制を徹底する。

- **Eliminating Waterfalls**: `await` は実際に必要になるまで遅らせるか、`Promise.all` で並列化する。
- **Bundle Size**: 巨大なライブラリやクライアントコンポーネントは `next/dynamic` で非同期インポートする。不要な Barrel Files（`index.ts` の一括エクスポート）を避ける。
- **Re-render**: `useEffect` の乱用を避け、導出ステートはレンダリング中に計算する。

**Incorrect:**

```tsx
// 逐次実行によるウォーターフォール（100ms + 100ms = 200ms）
const a = await getA();
const b = await getB();
```

**Correct:**

```tsx
// 並列実行（Max(100ms, 100ms) = 100ms）
const [a, b] = await Promise.all([getA(), getB()]);
```
