import { Content } from '@/components/site/content'
import { Stack } from '@/components/site/stack'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section className="px-(--tz-page-padding-x) py-(--tz-page-padding-y)">
      <Content size="lg">
        <Stack gap="xl">{children}</Stack>
      </Content>
    </section>
  )
}
