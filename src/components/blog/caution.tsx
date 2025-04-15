import { AlertCircleIcon } from 'lucide-react'

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/shadcn-ui/alert'
import { cn } from '@/lib/utils'

import type * as React from 'react'

type CautionProps = {
  title?: React.ReactNode
  description?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export function Caution({ className, title, description }: CautionProps) {
  return (
    <Alert
      className={cn(
        'border-amber-50 bg-amber-50 text-amber-900 dark:border-amber-950 dark:bg-amber-950 dark:text-amber-100',
        className,
      )}
    >
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}
