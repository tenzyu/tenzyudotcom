import { SkipLink } from '@tenzyu/ui/skip-link'
import { Stack } from '@tenzyu/ui/stack'
import { Content } from '@tenzyu/ui/content'

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
