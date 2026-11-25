import { Stack } from '@/components/site/stack'
import { Content } from '@/components/site/content'
import { PageAdmin } from '@/features/content-editor/ui/admin-gate'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="py-(--tz-page-padding-y)">
      <Content size="md" className="main-content">
        <PageAdmin>
          <Stack gap="xl">{children}</Stack>
        </PageAdmin>
      </Content>
    </div>
  )
}
