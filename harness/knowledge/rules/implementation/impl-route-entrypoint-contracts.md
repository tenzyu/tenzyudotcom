---
schema: harness/v1
kind: knowledge
knowledge_type: rule
pattern: simple
id: knowledge.rule.implementation.route-entrypoint-contracts
title: Route Entrypoint Contracts
status: active
tags:
  - nextjs
  - routing
  - intlayer
  - framework:next
  - subject:routing
  - framework:intlayer
  - kind:rule
  - criticality:high
  - status:active
affordances:
  declared: [context, check-candidate]
x:
  legacy:
    impactDescription: route entrypoint を薄く保ち、locale/static 化の共通契約を外さないようにする。
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
