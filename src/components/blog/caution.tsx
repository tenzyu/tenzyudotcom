import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import type * as React from 'react'

interface CautionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function Caution({ className, children, ...props }: CautionProps) {
  return (
    <div
      className={cn(
        'mb-4 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-500',
        className,
      )}
      {...props}
    >
      <AlertTriangle className='size-4 shrink-0' />
      <div className='[&_a]:underline [&_a]:underline-offset-4'>{children}</div>
    </div>
  )
}
