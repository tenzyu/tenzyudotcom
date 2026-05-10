import { Content, SkipLink, Stack } from '@tenzyu/ui'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <SkipLink href="#main-content" />
      <main id="main-content" className="px-[var(--tz-page-padding-x)] py-[var(--tz-page-padding-y)]">
        <Content size="md">
          <Stack gap="xl">{children}</Stack>
        </Content>
      </main>
    </>
  )
}
