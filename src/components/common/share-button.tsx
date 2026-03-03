'use client'

import { Button } from '@/components/shadcn-ui/button'

type ShareButtonProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export function ShareButton({ icon, label, onClick }: ShareButtonProps) {
  return (
    <Button
      variant="outline"
      className="flex h-auto flex-col items-center gap-1 py-3"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  )
}
