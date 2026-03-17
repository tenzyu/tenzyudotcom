import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/common'

type OtakuAsideProps = {
  label: string
  children: ReactNode
  className?: string
}

export function OtakuAside({ label, children, className }: OtakuAsideProps) {
  return (
    <details className={cn('group text-xs', className)}>
      <summary className="text-muted-foreground/80 hover:text-foreground flex cursor-pointer list-none items-center gap-1.5 rounded-sm py-1 text-xs marker:hidden">
        <span
          aria-hidden
          className="text-muted-foreground/70 inline-flex h-3 w-3 items-center justify-center transition-transform duration-200 group-open:rotate-90"
        >
          <ChevronRight className="size-3" />
        </span>
        <span>{label}</span>
      </summary>
      <div className="text-muted-foreground pt-2 text-xs leading-relaxed">
        {children}
      </div>
    </details>
  )
}
