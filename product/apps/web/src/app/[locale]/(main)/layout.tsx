import { SkipLink } from '@/components/site/skip-link'
import { Stack } from '@/components/site/stack'
import { Content } from '@/components/site/content'

export default function MainLayout({
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
        <Content size="md">
          <Stack gap="xl">{children}</Stack>
        </Content>
      </main>
    </>
  )
}
