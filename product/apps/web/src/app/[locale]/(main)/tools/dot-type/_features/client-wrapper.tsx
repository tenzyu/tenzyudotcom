'use client'

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="client-wrapper">{children}</div>
}
