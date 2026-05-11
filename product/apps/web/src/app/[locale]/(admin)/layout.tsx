import { Content } from '@/components/site/content'
import { SkipLink } from '@/components/site/skip-link'
import { Stack } from '@/components/site/stack'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <SkipLink href="#main-content" />
      <main
        id="main-content"
        className="px-[var(--tz-page-padding-x)] py-[var(--tz-page-padding-y)]"
      >
        <Content size="lg">
          <Stack gap="xl">{children}</Stack>
        </Content>
      </main>
    </>
  )
}
