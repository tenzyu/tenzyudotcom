---
title: Next Intlayer Entrypoint Contract
impact: HIGH
impactDescription: route entrypoint の共通契約を外すと静的化や locale context が崩れる
tags: nextjs, intlayer, routing
chapter: Implementation
---

## Next Intlayer Entrypoint Contract

`app/[locale]` 配下の route entrypoint は、薄いだけでなく、静的化と locale context の共通契約を満たす。新規 page や layout は既存の entrypoint パターンを踏襲する。

**Incorrect:**

```tsx
// locale 解決や provider を省略した page
export default async function Page() {
  return <MyPage />
}
```

**Correct:**

```tsx
export const dynamic = 'force-static'
export const generateMetadata = createPageMetadata('foo', {
  pathname: '/foo',
})
const FooPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <FooPageConent />
    </IntlayerServerProvider>
  )
}
export default FooPage
```
