---
title: Route Entrypoint Contracts
impact: HIGH
impactDescription: route entrypoint を薄く保ち、locale/static 化の共通契約を外さないようにする。
tags: nextjs, routing, intlayer
chapter: Implementation
---

## Route Entrypoint Contracts

`page.tsx`, `layout.tsx`, `route.ts` などの entrypoint は、フレームワーク接続と route 固有契約だけを持つ。  
`app/[locale]` 配下では locale 解決と static 化の共通契約も外さない。

**Avoid:**

```tsx
export default async function Page({ params }) {
  const data = await fetchData(params.id)
  const metadata = { title: data.name }
  return <div>{data.items.map((i) => <Item i={i} />)}</div>
}
```

**Prefer:**

```tsx
export const dynamic = "force-static"
export const generateMetadata = createPageMetadata("foo", {
  pathname: "/foo",
})

const FooPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  return (
    <IntlayerServerProvider locale={locale}>
      <FooPageContent />
    </IntlayerServerProvider>
  )
}
```

