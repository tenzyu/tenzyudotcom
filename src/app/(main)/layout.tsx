import type { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'osu! Skin Editor',
  description: '', // TODO:
}
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}