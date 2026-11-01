import { Stack } from '@/components/site/stack'
import { Content } from '@/components/site/content'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="py-(--tz-page-padding-y)">
      <Content size="md">
        <Stack gap="xl">{children}</Stack>
      </Content>
    </div>
  )
}
