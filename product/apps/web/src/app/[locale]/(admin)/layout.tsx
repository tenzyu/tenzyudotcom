import { Content } from '@tenzyu/ui/content'
import { SkipLink } from '@tenzyu/ui/skip-link'
import { Stack } from '@tenzyu/ui/stack'

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
