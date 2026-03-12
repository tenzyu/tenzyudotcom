import { Content } from '@/app/[locale]/_features/content'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col items-center px-4 py-8 md:py-12">
      <Content size="3xl" className="space-y-8 sm:space-y-6">
        {children}
      </Content>
    </div>
  )
}
