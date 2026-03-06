import type React from 'react'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col items-center px-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-8 sm:space-y-6">{children}</div>
    </div>
  )
}
